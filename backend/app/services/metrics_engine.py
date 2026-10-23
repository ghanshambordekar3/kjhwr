from typing import Dict, List, Any
import pandas as pd
import numpy as np

from app.models import AccuracyMetrics, HourlyErrorProfile, DailyMetric

class MetricsEngine:
    @staticmethod
    def calculate_metrics(df: pd.DataFrame) -> AccuracyMetrics:
        """Calculate comprehensive quantitative accuracy metrics from matched dataframe."""
        if df.empty or "error_mw" not in df.columns:
            return AccuracyMetrics(
                mae=0.0, rmse=0.0, mape=0.0, bias=0.0, nmae=0.0,
                p10_error=0.0, p50_error=0.0, p90_error=0.0, iqr_error=0.0,
                peak_mae=0.0, off_peak_mae=0.0,
                over_forecast_count=0, under_forecast_count=0, total_periods=0,
                mean_actual_mw=0.0, mean_forecast_mw=0.0,
                max_actual_mw=0.0, max_forecast_mw=0.0
            )

        errors = df["error_mw"].values
        abs_errors = df["abs_error_mw"].values
        pct_errors = df["pct_error"].values
        actuals = df["actual_mw"].values
        forecasts = df["forecast_mw"].values

        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        mape = float(np.mean(pct_errors))
        bias = float(np.mean(errors))
        mean_actual = float(np.mean(actuals))
        mean_forecast = float(np.mean(forecasts))
        max_actual = float(np.max(actuals))
        max_forecast = float(np.max(forecasts))

        nmae = (mae / mean_actual * 100.0) if mean_actual > 0 else 0.0

        p10 = float(np.percentile(errors, 10))
        p50 = float(np.percentile(errors, 50))
        p75 = float(np.percentile(errors, 75))
        p25 = float(np.percentile(errors, 25))
        p90 = float(np.percentile(errors, 90))
        iqr = float(p75 - p25)

        # Peak vs Off-Peak
        df_peak = df[df["is_peak"] == True]
        df_off_peak = df[df["is_peak"] == False]

        peak_mae = float(df_peak["abs_error_mw"].mean()) if not df_peak.empty else 0.0
        off_peak_mae = float(df_off_peak["abs_error_mw"].mean()) if not df_off_peak.empty else 0.0

        over_count = int(np.sum(errors > 0))
        under_count = int(np.sum(errors < 0))

        return AccuracyMetrics(
            mae=round(mae, 2),
            rmse=round(rmse, 2),
            mape=round(mape, 2),
            bias=round(bias, 2),
            nmae=round(nmae, 2),
            p10_error=round(p10, 2),
            p50_error=round(p50, 2),
            p90_error=round(p90, 2),
            iqr_error=round(iqr, 2),
            peak_mae=round(peak_mae, 2),
            off_peak_mae=round(off_peak_mae, 2),
            over_forecast_count=over_count,
            under_forecast_count=under_count,
            total_periods=len(df),
            mean_actual_mw=round(mean_actual, 1),
            mean_forecast_mw=round(mean_forecast, 1),
            max_actual_mw=round(max_actual, 1),
            max_forecast_mw=round(max_forecast, 1)
        )

    @staticmethod
    def calculate_hourly_profile(df: pd.DataFrame) -> List[HourlyErrorProfile]:
        """Aggregate error profiles by hour of the day (0-23)."""
        if df.empty:
            return []

        profiles = []
        grouped = df.groupby("hour")
        for hr, group in grouped:
            errs = group["error_mw"].values
            abs_errs = group["abs_error_mw"].values
            pct_errs = group["pct_error"].values
            acts = group["actual_mw"].values
            fcs = group["forecast_mw"].values

            mae = float(np.mean(abs_errs))
            rmse = float(np.sqrt(np.mean(errs ** 2)))
            bias = float(np.mean(errs))
            mape = float(np.mean(pct_errs))
            mean_act = float(np.mean(acts))
            mean_fc = float(np.mean(fcs))
            is_pk = bool(group["is_peak"].iloc[0])

            profiles.append(HourlyErrorProfile(
                hour=int(hr),
                hour_label=f"{int(hr):02d}:00",
                mean_actual_mw=round(mean_act, 1),
                mean_forecast_mw=round(mean_fc, 1),
                mae_mw=round(mae, 1),
                rmse_mw=round(rmse, 1),
                bias_mw=round(bias, 1),
                mape_pct=round(mape, 2),
                is_peak=is_pk
            ))
        return sorted(profiles, key=lambda x: x.hour)

    @staticmethod
    def calculate_daily_trend(df: pd.DataFrame) -> List[DailyMetric]:
        """Aggregate metrics day by day across the selected date range."""
        if df.empty:
            return []

        daily_list = []
        grouped = df.groupby("delivery_date")
        for dt, group in grouped:
            errs = group["error_mw"].values
            abs_errs = group["abs_error_mw"].values
            pct_errs = group["pct_error"].values
            acts = group["actual_mw"].values
            fcs = group["forecast_mw"].values

            daily_list.append(DailyMetric(
                date=str(dt),
                decision_date=str(group["decision_date"].iloc[0]),
                mae=round(float(np.mean(abs_errs)), 1),
                rmse=round(float(np.sqrt(np.mean(errs ** 2))), 1),
                mape=round(float(np.mean(pct_errs)), 2),
                bias=round(float(np.mean(errs)), 1),
                mean_actual=round(float(np.mean(acts)), 1),
                mean_forecast=round(float(np.mean(fcs)), 1),
                periods=len(group)
            ))
        return sorted(daily_list, key=lambda x: x.date)

    @staticmethod
    def calculate_error_histogram(df: pd.DataFrame, bins: int = 20) -> List[Dict[str, Any]]:
        """Calculate histogram distribution of forecast errors."""
        if df.empty:
            return []

        counts, bin_edges = np.histogram(df["error_mw"], bins=bins)
        result = []
        for i in range(len(counts)):
            center = (bin_edges[i] + bin_edges[i+1]) / 2.0
            result.append({
                "bin_start": round(float(bin_edges[i]), 1),
                "bin_end": round(float(bin_edges[i+1]), 1),
                "bin_center": round(float(center), 1),
                "count": int(counts[i])
            })
        return result

metrics_engine = MetricsEngine()
