import pytest
import pandas as pd
import numpy as np
from app.services.metrics_engine import metrics_engine

def test_metrics_calculation_synthetic():
    """Verify exact mathematical calculation of MAE, RMSE, MAPE, Bias."""
    data = {
        "startTime": ["2026-01-01T00:00:00Z", "2026-01-01T00:30:00Z"],
        "is_peak": [False, True],
        "actual_mw": [1000.0, 2000.0],
        "forecast_mw": [1200.0, 1800.0],
        "error_mw": [200.0, -200.0],
        "abs_error_mw": [200.0, 200.0],
        "pct_error": [20.0, 10.0]
    }
    df = pd.DataFrame(data)
    m = metrics_engine.calculate_metrics(df)

    assert m.mae == 200.0
    assert m.rmse == 200.0
    assert m.mape == 15.0
    assert m.bias == 0.0  # (200 - 200) / 2
    assert m.total_periods == 2
    assert m.over_forecast_count == 1
    assert m.under_forecast_count == 1
    assert m.peak_mae == 200.0
    assert m.off_peak_mae == 200.0

def test_empty_dataframe_metrics():
    """Verify metrics calculation handles empty input gracefully without raising."""
    m = metrics_engine.calculate_metrics(pd.DataFrame())
    assert m.mae == 0.0
    assert m.total_periods == 0
