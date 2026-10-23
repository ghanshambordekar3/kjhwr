import io
import csv
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Query, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.models import (
    ForecastEvaluationResponse,
    ThermalProcurementResponse,
    SystemStatusResponse,
    SettlementPeriodData
)
from app.services.elexon_service import elexon_service
from app.services.forecast_engine import forecast_engine
from app.services.metrics_engine import metrics_engine
from app.services.procurement_engine import procurement_engine

app = FastAPI(
    title="UK Electricity Utility - Day-Ahead Wind Forecast & Procurement Portal",
    description="Quantitative Renewable Generation Forecast Evaluation & Thermal Procurement Decision Support System for UK Day-Ahead Electricity Trading.",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite dev port, Vercel, Heroku, Docker)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kjhwr-2.onrender.com",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "app": "UK Electricity Utility Wind Forecast & Procurement Portal",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/status", response_model=SystemStatusResponse)
def get_system_status():
    """Check data caching status and Elexon connectivity."""
    return SystemStatusResponse(**elexon_service.get_status())

@app.get("/api/forecast/evaluation", response_model=ForecastEvaluationResponse)
def get_forecast_evaluation(
    date_from: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    cutoff_hour: int = Query(11, ge=0, le=23, description="Day-Ahead Gate Closure hour on D-1 (e.g. 11:00 AM GMT)"),
    resolution: str = Query("half_hourly", pattern="^(half_hourly|hourly)$", description="Settlement resolution"),
    filter_by: str = Query("delivery_date", pattern="^(delivery_date|decision_date)$", description="Filter by delivery or decision date")
):
    """
    Evaluate renewable generation forecasts available at Day-Ahead decision time
    against actual wind generation for January 2026.
    """
    try:
        df_matched = forecast_engine.get_matched_forecast_actuals(
            date_from=date_from,
            date_to=date_to,
            cutoff_hour=cutoff_hour,
            resolution=resolution,
            filter_by=filter_by
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error evaluating forecast: {str(e)}")

    if df_matched.empty:
        raise HTTPException(status_code=404, detail="No matching forecast and actual data found for the given criteria.")

    metrics = metrics_engine.calculate_metrics(df_matched)
    hourly_profile = metrics_engine.calculate_hourly_profile(df_matched)
    daily_trend = metrics_engine.calculate_daily_trend(df_matched)

    # Convert time series records to Pydantic models
    time_series = [
        SettlementPeriodData(
            startTime=r["startTime"],
            settlementDate=r.get("delivery_date", ""),
            settlementPeriod=int(r["settlementPeriod"]),
            hour=int(r["hour"]),
            minute=int(r["minute"]),
            is_peak=bool(r["is_peak"]),
            actual_mw=float(r["actual_mw"]),
            forecast_mw=float(r["forecast_mw"]),
            error_mw=round(float(r["error_mw"]), 1),
            abs_error_mw=round(float(r["abs_error_mw"]), 1),
            pct_error=round(float(r["pct_error"]), 2),
            publishTime=r.get("publishTime"),
            lead_time_hours=r.get("lead_time_hours")
        )
        for _, r in df_matched.iterrows()
    ]

    return ForecastEvaluationResponse(
        delivery_date_from=date_from,
        delivery_date_to=date_to,
        decision_cutoff_hour=cutoff_hour,
        resolution=resolution,
        metrics=metrics,
        time_series=time_series,
        hourly_profile=hourly_profile,
        daily_trend=daily_trend
    )

@app.get("/api/forecast/histogram")
def get_error_histogram(
    date_from: str = Query("2026-01-01"),
    date_to: str = Query("2026-01-31"),
    cutoff_hour: int = Query(11, ge=0, le=23),
    bins: int = Query(25, ge=5, le=50)
):
    """Get histogram bins of forecast errors for distribution visualization."""
    df_matched = forecast_engine.get_matched_forecast_actuals(
        date_from=date_from,
        date_to=date_to,
        cutoff_hour=cutoff_hour,
        resolution="half_hourly"
    )
    if df_matched.empty:
        return {"bins": []}
    hist = metrics_engine.calculate_error_histogram(df_matched, bins=bins)
    return {"bins": hist}

@app.get("/api/forecast/vintages")
def get_vintages(
    delivery_date: str = Query("2026-01-05", description="Delivery date (YYYY-MM-DD)"),
    target_hour: int = Query(12, ge=0, le=23, description="Target delivery hour (0-23)")
):
    """Get forecast evolution across publishing vintages leading up to delivery."""
    vintages = forecast_engine.get_forecast_vintages(delivery_date, target_hour)
    return {"delivery_date": delivery_date, "target_hour": target_hour, "vintages": vintages}

@app.get("/api/procurement/plan", response_model=ThermalProcurementResponse)
def get_thermal_procurement_plan(
    delivery_date: str = Query("2026-01-05", description="Delivery date (YYYY-MM-DD)"),
    cutoff_hour: int = Query(11, ge=0, le=23, description="Day-Ahead Cutoff hour on D-1"),
    hedging_strategy: str = Query("conservative_p90", pattern="^(none|bias_corrected|conservative_p90|mae_buffer)$"),
    custom_buffer_mw: Optional[float] = Query(None, description="Custom risk buffer in MW"),
    demand_scale: float = Query(1.0, ge=0.1, le=5.0, description="Multiplier for baseline utility demand")
):
    """
    Simulate Day-Ahead thermal procurement decisions, residual demand,
    and quant-adjusted risk buffer savings.
    """
    return procurement_engine.calculate_procurement(
        delivery_date=delivery_date,
        cutoff_hour=cutoff_hour,
        hedging_strategy=hedging_strategy,
        custom_buffer_mw=custom_buffer_mw,
        demand_scale=demand_scale
    )

@app.get("/api/export/csv")
def export_csv(
    date_from: str = Query("2026-01-01"),
    date_to: str = Query("2026-01-31"),
    cutoff_hour: int = Query(11),
    resolution: str = Query("half_hourly")
):
    """Download matched actual and forecast dataset as CSV."""
    df_matched = forecast_engine.get_matched_forecast_actuals(
        date_from=date_from,
        date_to=date_to,
        cutoff_hour=cutoff_hour,
        resolution=resolution
    )
    if df_matched.empty:
        raise HTTPException(status_code=404, detail="No data available for export.")

    output = io.StringIO()
    cols = [
        "delivery_date", "decision_date", "startTime", "settlementPeriod",
        "hour", "minute", "is_peak", "actual_mw", "forecast_mw",
        "error_mw", "abs_error_mw", "pct_error", "publishTime", "lead_time_hours"
    ]
    export_cols = [c for c in cols if c in df_matched.columns]
    df_matched[export_cols].to_csv(output, index=False)
    output.seek(0)

    filename = f"elexon_wind_forecast_accuracy_{date_from}_to_{date_to}_cutoff_{cutoff_hour}h.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
