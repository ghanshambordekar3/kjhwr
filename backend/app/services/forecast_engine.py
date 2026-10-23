from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict
import pandas as pd
import numpy as np

from app.services.elexon_service import elexon_service
from app.utils.helpers import get_settlement_period, is_peak_settlement_period, get_day_ahead_cutoff

class ForecastEngine:
    def __init__(self):
        self.service = elexon_service

    def get_matched_forecast_actuals(
        self,
        date_from: str = "2026-01-01",
        date_to: str = "2026-01-31",
        cutoff_hour: int = 11,
        resolution: str = "half_hourly",
        filter_by: str = "delivery_date"
    ) -> pd.DataFrame:
        """
        Match actual wind generation with the point-in-time latest forecast
        available at the Day-Ahead decision cut-off time (D-1 at cutoff_hour:00:00Z).
        """
        df_actuals = self.service.get_actuals()
        df_forecasts = self.service.get_forecasts()

        if df_actuals.empty or df_forecasts.empty:
            return pd.DataFrame()

        # Parse query date boundaries in UTC
        start_date = datetime.strptime(date_from, "%Y-%m-%d").date()
        end_date = datetime.strptime(date_to, "%Y-%m-%d").date()

        if filter_by == "decision_date":
            # If filtering by decision date (Day D-1), delivery dates are (D-1) + 1 day
            delivery_start = start_date + timedelta(days=1)
            delivery_end = end_date + timedelta(days=1)
        else:
            delivery_start = start_date
            delivery_end = end_date

        # Iterate over each delivery date in range
        matched_rows = []
        curr_delivery = delivery_start

        while curr_delivery <= delivery_end:
            # Cut-off time is D-1 at cutoff_hour:00:00Z
            cutoff_dt = datetime(
                year=curr_delivery.year,
                month=curr_delivery.month,
                day=curr_delivery.day,
                hour=cutoff_hour,
                minute=0,
                second=0,
                tzinfo=timezone.utc
            ) - timedelta(days=1)

            # Delivery day window: curr_delivery 00:00 to 23:59:59Z
            day_start_dt = datetime(
                year=curr_delivery.year,
                month=curr_delivery.month,
                day=curr_delivery.day,
                hour=0,
                minute=0,
                second=0,
                tzinfo=timezone.utc
            )
            day_end_dt = day_start_dt + timedelta(days=1)

            # Filter actuals for this delivery day
            act_day = df_actuals[
                (df_actuals["startTime_dt"] >= day_start_dt) &
                (df_actuals["startTime_dt"] < day_end_dt)
            ].copy()

            if act_day.empty:
                curr_delivery += timedelta(days=1)
                continue

            # Filter forecasts published at or before the decision cut-off
            fc_valid = df_forecasts[
                (df_forecasts["publishTime_dt"] <= cutoff_dt) &
                (df_forecasts["startTime_dt"] >= day_start_dt) &
                (df_forecasts["startTime_dt"] < day_end_dt)
            ].copy()

            if fc_valid.empty:
                curr_delivery += timedelta(days=1)
                continue

            # For each target hour, find the latest published forecast
            latest_fc = fc_valid.sort_values("publishTime_dt").groupby("startTime_dt").last().reset_index()

            # Map hourly forecasts to settlement periods
            for _, act_row in act_day.iterrows():
                target_dt = act_row["startTime_dt"]
                # Match to the top-of-the-hour forecast (e.g. 14:30 maps to 14:00 forecast)
                hour_top_dt = target_dt.replace(minute=0, second=0)
                fc_match = latest_fc[latest_fc["startTime_dt"] == hour_top_dt]

                if not fc_match.empty:
                    fc_row = fc_match.iloc[0]
                    fc_mw = float(fc_row["generation"])
                    act_mw = float(act_row["generation"])
                    pub_time = fc_row["publishTime"]
                    pub_dt = fc_row["publishTime_dt"]
                    lead_time_hrs = (target_dt - pub_dt).total_seconds() / 3600.0

                    sp = act_row.get("settlementPeriod")
                    if sp is None or pd.isna(sp):
                        sp = get_settlement_period(target_dt)
                    else:
                        sp = int(sp)

                    matched_rows.append({
                        "delivery_date": curr_delivery.strftime("%Y-%m-%d"),
                        "decision_date": (curr_delivery - timedelta(days=1)).strftime("%Y-%m-%d"),
                        "startTime": act_row["startTime"],
                        "startTime_dt": target_dt,
                        "settlementPeriod": sp,
                        "hour": target_dt.hour,
                        "minute": target_dt.minute,
                        "is_peak": is_peak_settlement_period(sp),
                        "actual_mw": act_mw,
                        "forecast_mw": fc_mw,
                        "error_mw": fc_mw - act_mw,
                        "abs_error_mw": abs(fc_mw - act_mw),
                        "pct_error": (abs(fc_mw - act_mw) / act_mw * 100.0) if act_mw > 0 else 0.0,
                        "publishTime": pub_time,
                        "lead_time_hours": round(lead_time_hrs, 2)
                    })

            curr_delivery += timedelta(days=1)

        if not matched_rows:
            return pd.DataFrame()

        df_matched = pd.DataFrame(matched_rows)

        if resolution == "hourly":
            # Aggregate to hourly resolution
            df_hourly = df_matched.groupby(["delivery_date", "decision_date", "hour"]).agg(
                startTime=("startTime", "first"),
                settlementPeriod=("settlementPeriod", "min"),
                is_peak=("is_peak", "first"),
                actual_mw=("actual_mw", "mean"),
                forecast_mw=("forecast_mw", "first"),  # forecast is already hourly
                publishTime=("publishTime", "first"),
                lead_time_hours=("lead_time_hours", "mean")
            ).reset_index()

            df_hourly["minute"] = 0
            df_hourly["error_mw"] = df_hourly["forecast_mw"] - df_hourly["actual_mw"]
            df_hourly["abs_error_mw"] = df_hourly["error_mw"].abs()
            df_hourly["pct_error"] = np.where(
                df_hourly["actual_mw"] > 0,
                (df_hourly["abs_error_mw"] / df_hourly["actual_mw"]) * 100.0,
                0.0
            )
            return df_hourly.sort_values(["delivery_date", "hour"]).reset_index(drop=True)

        return df_matched.sort_values(["delivery_date", "settlementPeriod"]).reset_index(drop=True)

    def get_forecast_vintages(self, delivery_date: str, target_hour: int = 12) -> List[Dict]:
        """
        Retrieve the vintage evolution of forecasts for a specific target hour,
        showing how forecasts evolved leading up to delivery.
        """
        df_forecasts = self.service.get_forecasts()
        df_actuals = self.service.get_actuals()

        target_dt = datetime.strptime(f"{delivery_date} {target_hour:02d}:00:00", "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)

        fc_target = df_forecasts[df_forecasts["startTime_dt"] == target_dt].sort_values("publishTime_dt")
        act_target = df_actuals[df_actuals["startTime_dt"] == target_dt]
        actual_val = float(act_target.iloc[0]["generation"]) if not act_target.empty else None

        vintages = []
        for _, r in fc_target.iterrows():
            lead_hrs = (target_dt - r["publishTime_dt"]).total_seconds() / 3600.0
            vintages.append({
                "publishTime": r["publishTime"],
                "lead_time_hours": round(lead_hrs, 1),
                "forecast_mw": float(r["generation"]),
                "actual_mw": actual_val,
                "error_mw": float(r["generation"]) - actual_val if actual_val is not None else None
            })
        return vintages

forecast_engine = ForecastEngine()
