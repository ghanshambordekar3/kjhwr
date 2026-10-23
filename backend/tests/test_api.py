import pytest
from app.main import (
    root,
    get_system_status,
    get_forecast_evaluation,
    get_error_histogram,
    get_vintages,
    get_thermal_procurement_plan,
    export_csv
)

def test_root():
    res = root()
    assert "UK Electricity Utility" in res["app"]
    assert res["status"] == "online"

def test_system_status():
    res = get_system_status()
    assert res.cached_actuals_count > 0
    assert res.cached_forecasts_count > 0
    assert res.status == "online"

def test_forecast_evaluation_january():
    res = get_forecast_evaluation(
        date_from="2026-01-02",
        date_to="2026-01-05",
        cutoff_hour=11,
        resolution="half_hourly",
        filter_by="delivery_date"
    )
    assert res.metrics.mae > 0
    assert res.metrics.rmse > 0
    assert len(res.time_series) > 0
    assert len(res.hourly_profile) == 24
    assert len(res.daily_trend) >= 3

def test_forecast_evaluation_hourly():
    res = get_forecast_evaluation(
        date_from="2026-01-02",
        date_to="2026-01-03",
        cutoff_hour=11,
        resolution="hourly",
        filter_by="delivery_date"
    )
    assert res.resolution == "hourly"
    assert len(res.time_series) <= 48

def test_error_histogram():
    res = get_error_histogram(
        date_from="2026-01-02",
        date_to="2026-01-05",
        cutoff_hour=11,
        bins=20
    )
    assert "bins" in res
    assert len(res["bins"]) > 0
    assert "count" in res["bins"][0]

def test_vintages():
    res = get_vintages(delivery_date="2026-01-05", target_hour=14)
    assert res["delivery_date"] == "2026-01-05"
    assert "vintages" in res

def test_thermal_procurement_plan():
    res = get_thermal_procurement_plan(
        delivery_date="2026-01-05",
        cutoff_hour=11,
        hedging_strategy="conservative_p90",
        custom_buffer_mw=None,
        demand_scale=1.0
    )
    assert res.summary.total_demand_mwh > 0
    assert res.summary.naive_thermal_mwh > 0
    assert res.summary.risk_buffer_mw > 0
    assert len(res.periods) > 0

def test_export_csv():
    res = export_csv(
        date_from="2026-01-02",
        date_to="2026-01-03",
        cutoff_hour=11,
        resolution="half_hourly"
    )
    assert res.status_code == 200
    assert "attachment" in res.headers["content-disposition"]
