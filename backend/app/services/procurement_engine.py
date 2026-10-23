from typing import Dict, List, Optional
import numpy as np
import pandas as pd

from app.config import DEFAULT_DEMAND_PROFILE_MW
from app.models import ThermalProcurementResponse, ThermalProcurementSummary, ThermalProcurementPeriod
from app.services.forecast_engine import forecast_engine
from app.services.metrics_engine import metrics_engine

class ProcurementEngine:
    # Standard UK market pricing assumptions (£/MWh)
    DA_MARKET_PRICE_GBP = 75.0      # Day-Ahead wholesale power price
    SYSTEM_BUY_PRICE_GBP = 135.0    # Cashout penalty when short (SBP)
    SYSTEM_SELL_PRICE_GBP = 45.0    # Cashout discount when long (SSP)

    def calculate_procurement(
        self,
        delivery_date: str = "2026-01-05",
        cutoff_hour: int = 11,
        hedging_strategy: str = "conservative_p90",
        custom_buffer_mw: Optional[float] = None,
        demand_scale: float = 1.0
    ) -> ThermalProcurementResponse:
        """
        Simulate Day-Ahead thermal power procurement decisions and calculate
        quant-adjusted risk buffers vs naive procurement.
        """
        # Get matched data for this specific delivery date
        df_matched = forecast_engine.get_matched_forecast_actuals(
            date_from=delivery_date,
            date_to=delivery_date,
            cutoff_hour=cutoff_hour,
            resolution="half_hourly"
        )

        if df_matched.empty:
            # Fallback if no data for single day
            return ThermalProcurementResponse(
                delivery_date=delivery_date,
                decision_cutoff_hour=cutoff_hour,
                hedging_strategy=hedging_strategy,
                summary=ThermalProcurementSummary(
                    total_demand_mwh=0, total_wind_forecast_mwh=0, total_wind_actual_mwh=0,
                    naive_thermal_mwh=0, hedged_thermal_mwh=0, naive_imbalance_cost_gbp=0,
                    hedged_imbalance_cost_gbp=0, net_savings_gbp=0, risk_buffer_mw=0
                ),
                periods=[]
            )

        # Baseline demand profile (48 SPs) scaled
        base_demand = [d * demand_scale for d in DEFAULT_DEMAND_PROFILE_MW]

        # Calculate metrics for the period to derive buffer
        metrics = metrics_engine.calculate_metrics(df_matched)
        bias = metrics.bias

        # Determine risk buffer in MW
        if custom_buffer_mw is not None and custom_buffer_mw >= 0:
            buffer_mw = custom_buffer_mw
        elif hedging_strategy == "conservative_p90":
            # 90th percentile of positive errors (over-forecasts)
            pos_errors = df_matched[df_matched["error_mw"] > 0]["error_mw"]
            buffer_mw = float(np.percentile(pos_errors, 90)) if len(pos_errors) > 0 else float(metrics.mae)
        elif hedging_strategy == "bias_corrected":
            buffer_mw = max(0.0, float(bias))
        elif hedging_strategy == "mae_buffer":
            buffer_mw = float(metrics.mae * 0.75)
        else:  # "none"
            buffer_mw = 0.0

        periods_res = []
        total_demand_mwh = 0.0
        total_wind_fc_mwh = 0.0
        total_wind_act_mwh = 0.0
        naive_thermal_mwh = 0.0
        hedged_thermal_mwh = 0.0
        naive_imbalance_cost = 0.0
        hedged_imbalance_cost = 0.0

        for idx, row in df_matched.iterrows():
            sp = int(row["settlementPeriod"])
            sp_idx = min(sp - 1, len(base_demand) - 1)
            demand_mw = base_demand[sp_idx]
            act_wind = float(row["actual_mw"])
            fc_wind = float(row["forecast_mw"])

            # 30 minutes = 0.5 hours
            hours = 0.5

            total_demand_mwh += demand_mw * hours
            total_wind_fc_mwh += fc_wind * hours
            total_wind_act_mwh += act_wind * hours

            # Naive thermal procurement: procures residual (Demand - WindForecast)
            naive_thermal_mw = max(0.0, demand_mw - fc_wind)
            naive_thermal_mwh += naive_thermal_mw * hours

            # Hedged thermal procurement: procures residual with risk buffer
            # Effective wind assumed = max(0, fc_wind - buffer_mw)
            hedged_wind_assumed = max(0.0, fc_wind - buffer_mw)
            hedged_thermal_mw = max(0.0, demand_mw - hedged_wind_assumed)
            hedged_thermal_mwh += hedged_thermal_mw * hours

            # Real-time physical balance:
            # Net generation = Thermal_Procured + Actual_Wind
            # Imbalance = Net Generation - Demand
            naive_imbalance_mw = (naive_thermal_mw + act_wind) - demand_mw
            hedged_imbalance_mw = (hedged_thermal_mw + act_wind) - demand_mw

            # Financial imbalance calculation:
            # If Imbalance < 0 (Deficit / Short): must pay SBP spread penalty
            # If Imbalance > 0 (Surplus / Long): sells back at SSP discount
            def calc_imbalance_cashout(imb_mw: float, thermal_mw: float) -> float:
                imb_mwh = imb_mw * hours
                cost = 0.0
                if imb_mw < 0:
                    # Short deficit: penalty is the spread between SBP and DA price
                    penalty_spread = self.SYSTEM_BUY_PRICE_GBP - self.DA_MARKET_PRICE_GBP
                    cost += abs(imb_mwh) * penalty_spread
                else:
                    # Long surplus: discount lost is DA price minus SSP
                    discount_loss = self.DA_MARKET_PRICE_GBP - self.SYSTEM_SELL_PRICE_GBP
                    cost += imb_mwh * discount_loss
                return cost

            c_naive = calc_imbalance_cashout(naive_imbalance_mw, naive_thermal_mw)
            c_hedged = calc_imbalance_cashout(hedged_imbalance_mw, hedged_thermal_mw)

            naive_imbalance_cost += c_naive
            hedged_imbalance_cost += c_hedged

            periods_res.append(ThermalProcurementPeriod(
                startTime=row["startTime"],
                settlementPeriod=sp,
                demand_mw=round(demand_mw, 1),
                actual_wind_mw=round(act_wind, 1),
                forecast_wind_mw=round(fc_wind, 1),
                naive_thermal_mw=round(naive_thermal_mw, 1),
                hedged_thermal_mw=round(hedged_thermal_mw, 1),
                naive_imbalance_mw=round(naive_imbalance_mw, 1),
                hedged_imbalance_mw=round(hedged_imbalance_mw, 1)
            ))

        net_savings = naive_imbalance_cost - hedged_imbalance_cost

        summary = ThermalProcurementSummary(
            total_demand_mwh=round(total_demand_mwh, 1),
            total_wind_forecast_mwh=round(total_wind_fc_mwh, 1),
            total_wind_actual_mwh=round(total_wind_act_mwh, 1),
            naive_thermal_mwh=round(naive_thermal_mwh, 1),
            hedged_thermal_mwh=round(hedged_thermal_mwh, 1),
            naive_imbalance_cost_gbp=round(naive_imbalance_cost, 2),
            hedged_imbalance_cost_gbp=round(hedged_imbalance_cost, 2),
            net_savings_gbp=round(net_savings, 2),
            risk_buffer_mw=round(buffer_mw, 1)
        )

        return ThermalProcurementResponse(
            delivery_date=delivery_date,
            decision_cutoff_hour=cutoff_hour,
            hedging_strategy=hedging_strategy,
            summary=summary,
            periods=periods_res
        )

procurement_engine = ProcurementEngine()
