from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SettlementPeriodData(BaseModel):
    startTime: str
    settlementDate: str
    settlementPeriod: int
    hour: int
    minute: int
    is_peak: bool
    actual_mw: Optional[float] = None
    forecast_mw: Optional[float] = None
    error_mw: Optional[float] = None
    abs_error_mw: Optional[float] = None
    pct_error: Optional[float] = None
    publishTime: Optional[str] = None
    lead_time_hours: Optional[float] = None

class AccuracyMetrics(BaseModel):
    mae: float = Field(..., description="Mean Absolute Error in MW")
    rmse: float = Field(..., description="Root Mean Square Error in MW")
    mape: float = Field(..., description="Mean Absolute Percentage Error (%)")
    bias: float = Field(..., description="Mean Error in MW (Bias: + over-forecast, - under-forecast)")
    nmae: float = Field(..., description="Normalized MAE as % of mean generation")
    p10_error: float = Field(..., description="10th percentile error in MW")
    p50_error: float = Field(..., description="Median error in MW")
    p90_error: float = Field(..., description="90th percentile error in MW")
    iqr_error: float = Field(..., description="Interquartile Range of error in MW")
    peak_mae: float = Field(..., description="MAE during Peak hours (SP 15-38, 07:00-19:00)")
    off_peak_mae: float = Field(..., description="MAE during Off-Peak hours")
    over_forecast_count: int = Field(..., description="Count of periods where Forecast > Actual")
    under_forecast_count: int = Field(..., description="Count of periods where Forecast < Actual")
    total_periods: int = Field(..., description="Total settlement periods evaluated")
    mean_actual_mw: float = Field(..., description="Average actual generation in MW")
    mean_forecast_mw: float = Field(..., description="Average forecast generation in MW")
    max_actual_mw: float = Field(..., description="Peak actual generation in MW")
    max_forecast_mw: float = Field(..., description="Peak forecast generation in MW")

class HourlyErrorProfile(BaseModel):
    hour: int
    hour_label: str
    mean_actual_mw: float
    mean_forecast_mw: float
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    mape_pct: float
    is_peak: bool

class DailyMetric(BaseModel):
    date: str
    decision_date: str
    mae: float
    rmse: float
    mape: float
    bias: float
    mean_actual: float
    mean_forecast: float
    periods: int

class ThermalProcurementPeriod(BaseModel):
    startTime: str
    settlementPeriod: int
    demand_mw: float
    actual_wind_mw: float
    forecast_wind_mw: float
    naive_thermal_mw: float
    hedged_thermal_mw: float
    naive_imbalance_mw: float
    hedged_imbalance_mw: float

class ThermalProcurementSummary(BaseModel):
    total_demand_mwh: float
    total_wind_forecast_mwh: float
    total_wind_actual_mwh: float
    naive_thermal_mwh: float
    hedged_thermal_mwh: float
    naive_imbalance_cost_gbp: float
    hedged_imbalance_cost_gbp: float
    net_savings_gbp: float
    risk_buffer_mw: float

class ForecastEvaluationResponse(BaseModel):
    delivery_date_from: str
    delivery_date_to: str
    decision_cutoff_hour: int
    resolution: str  # "half_hourly" or "hourly"
    metrics: AccuracyMetrics
    time_series: List[SettlementPeriodData]
    hourly_profile: List[HourlyErrorProfile]
    daily_trend: List[DailyMetric]

class ThermalProcurementResponse(BaseModel):
    delivery_date: str
    decision_cutoff_hour: int
    hedging_strategy: str
    summary: ThermalProcurementSummary
    periods: List[ThermalProcurementPeriod]

class SystemStatusResponse(BaseModel):
    status: str
    cached_actuals_count: int
    cached_forecasts_count: int
    date_range_actuals: Dict[str, str]
    date_range_forecasts: Dict[str, str]
    live_api_connected: bool
