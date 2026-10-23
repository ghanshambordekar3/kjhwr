import json
import logging
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
import pandas as pd

from app.config import FUELHH_CACHE_PATH, WINDFOR_CACHE_PATH, ELEXON_API_BASE
from app.utils.helpers import parse_utc_iso

logger = logging.getLogger(__name__)

class ElexonService:
    def __init__(self):
        self._df_actuals: Optional[pd.DataFrame] = None
        self._df_forecasts: Optional[pd.DataFrame] = None
        self._load_cached_data()

    def _load_cached_data(self):
        """Load pre-cached January 2026 data from disk."""
        try:
            if FUELHH_CACHE_PATH.exists():
                with open(FUELHH_CACHE_PATH, "r", encoding="utf-8") as f:
                    raw_act = json.load(f)
                df_act = pd.DataFrame(raw_act)
                df_act["startTime_dt"] = pd.to_datetime(df_act["startTime"], utc=True)
                df_act["publishTime_dt"] = pd.to_datetime(df_act["publishTime"], utc=True)
                df_act["generation"] = pd.to_numeric(df_act["generation"], errors="coerce")
                self._df_actuals = df_act.sort_values("startTime_dt").reset_index(drop=True)
                logger.info("Loaded %d cached actual wind records", len(self._df_actuals))

            if WINDFOR_CACHE_PATH.exists():
                with open(WINDFOR_CACHE_PATH, "r", encoding="utf-8") as f:
                    raw_fc = json.load(f)
                df_fc = pd.DataFrame(raw_fc)
                df_fc["startTime_dt"] = pd.to_datetime(df_fc["startTime"], utc=True)
                df_fc["publishTime_dt"] = pd.to_datetime(df_fc["publishTime"], utc=True)
                df_fc["generation"] = pd.to_numeric(df_fc["generation"], errors="coerce")
                self._df_forecasts = df_fc.sort_values("publishTime_dt").reset_index(drop=True)
                logger.info("Loaded %d cached forecast records", len(self._df_forecasts))
        except Exception as e:
            logger.error("Failed to load cached data: %s", e)

    def get_actuals(self) -> pd.DataFrame:
        if self._df_actuals is None or self._df_actuals.empty:
            self._load_cached_data()
        return self._df_actuals.copy()

    def get_forecasts(self) -> pd.DataFrame:
        if self._df_forecasts is None or self._df_forecasts.empty:
            self._load_cached_data()
        return self._df_forecasts.copy()

    def fetch_live_stream(self, dataset: str, start_iso: str, end_iso: str) -> List[Dict]:
        """Fetch real-time stream from Elexon BMRS API with timeout handling."""
        url = f"{ELEXON_API_BASE}/datasets/{dataset}/stream?publishDateTimeFrom={start_iso}&publishDateTimeTo={end_iso}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "UK-Electricity-Utility-Portal/1.0",
                "Accept": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data

    def get_status(self) -> Dict:
        act_count = len(self._df_actuals) if self._df_actuals is not None else 0
        fc_count = len(self._df_forecasts) if self._df_forecasts is not None else 0
        act_range = {}
        fc_range = {}
        if act_count > 0:
            act_range = {
                "start": self._df_actuals["startTime"].min(),
                "end": self._df_actuals["startTime"].max()
            }
        if fc_count > 0:
            fc_range = {
                "start": self._df_forecasts["startTime"].min(),
                "end": self._df_forecasts["startTime"].max()
            }
        return {
            "status": "online" if act_count > 0 else "degraded",
            "cached_actuals_count": act_count,
            "cached_forecasts_count": fc_count,
            "date_range_actuals": act_range,
            "date_range_forecasts": fc_range,
            "live_api_connected": True
        }

elexon_service = ElexonService()
