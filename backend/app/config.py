import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

FUELHH_CACHE_PATH = DATA_DIR / "fuelhh_wind_jan2026.json"
WINDFOR_CACHE_PATH = DATA_DIR / "windfor_jan2026.json"

DEFAULT_DECISION_CUTOFF_HOUR = 11  # 11:00 AM GMT on Day D-1 (UK Day-Ahead Gate Closure)
ELEXON_API_BASE = os.getenv("ELEXON_API_BASE", "https://data.elexon.co.uk/bmrs/api/v1")

# Standard UK Utility Demand Profile Baseline (MW) for 48 Settlement Periods
# Based on typical winter weekday load curve (morning ramp, evening peak)
DEFAULT_DEMAND_PROFILE_MW = [
    22500, 21800, 21200, 20800, 20600, 20700, 21100, 22000, # 00:00 - 04:00 (SP 1-8)
    23500, 26000, 29000, 32000, 34500, 36000, 37000, 37500, # 04:00 - 08:00 (SP 9-16)
    37800, 38000, 38100, 38000, 37800, 37600, 37400, 37300, # 08:00 - 12:00 (SP 17-24)
    37200, 37000, 36800, 36700, 36900, 37200, 37800, 38500, # 12:00 - 16:00 (SP 25-32)
    40000, 41500, 42000, 41800, 41000, 39500, 37500, 35000, # 16:00 - 20:00 (SP 33-40) - Evening Peak
    32500, 30000, 28000, 26500, 25200, 24200, 23500, 22800  # 20:00 - 24:00 (SP 41-48)
]
