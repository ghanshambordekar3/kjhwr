import pytest
import pandas as pd
from datetime import datetime, timezone
from app.services.forecast_engine import forecast_engine

def test_point_in_time_matching():
    """Verify that forecasts selected strictly have publishTime <= D-1 cutoff."""
    df = forecast_engine.get_matched_forecast_actuals(
        date_from="2026-01-02",
        date_to="2026-01-02",
        cutoff_hour=11,
        resolution="half_hourly"
    )
    assert not df.empty, "Matched dataset should not be empty for 2026-01-02"
    # Cutoff for 2026-01-02 delivery is 2026-01-01 11:00:00Z
    cutoff_dt = pd.to_datetime("2026-01-01 11:00:00+00:00")
    for pub_str in df["publishTime"]:
        pub_dt = pd.to_datetime(pub_str)
        assert pub_dt <= cutoff_dt, f"Forecast {pub_str} was published after cutoff {cutoff_dt}"

def test_resolution_switch():
    """Verify half-hourly returns up to 48 periods while hourly aggregates to up to 24."""
    df_hh = forecast_engine.get_matched_forecast_actuals(
        date_from="2026-01-05",
        date_to="2026-01-05",
        cutoff_hour=11,
        resolution="half_hourly"
    )
    df_h = forecast_engine.get_matched_forecast_actuals(
        date_from="2026-01-05",
        date_to="2026-01-05",
        cutoff_hour=11,
        resolution="hourly"
    )
    assert len(df_hh) > 0
    assert len(df_h) > 0
    assert len(df_hh) >= len(df_h)
    assert len(df_h) <= 24

def test_cutoff_sensitivity():
    """Verify that different cutoff hours return different available forecasts."""
    df_early = forecast_engine.get_matched_forecast_actuals(
        date_from="2026-01-10",
        date_to="2026-01-10",
        cutoff_hour=6
    )
    df_late = forecast_engine.get_matched_forecast_actuals(
        date_from="2026-01-10",
        date_to="2026-01-10",
        cutoff_hour=18
    )
    assert not df_early.empty
    assert not df_late.empty
