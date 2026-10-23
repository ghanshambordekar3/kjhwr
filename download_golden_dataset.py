import urllib.request
import json
import os
import time
import pandas as pd

os.makedirs("backend/data", exist_ok=True)

actual_cache_file = "backend/data/fuelhh_wind_jan2026.json"
forecast_cache_file = "backend/data/windfor_jan2026.json"

print("--- Step 1: Fetching FUELHH (Actual Wind Generation) ---")
url_actual = "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?publishDateTimeFrom=2025-12-31T00:00:00Z&publishDateTimeTo=2026-02-02T23:59:59Z"
t0 = time.time()
req = urllib.request.Request(url_actual, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
with urllib.request.urlopen(req) as resp:
    raw_actual = json.loads(resp.read().decode())

print(f"Fetched {len(raw_actual)} total FUELHH records in {time.time()-t0:.2f}s")
# Filter WIND
wind_actual = [
    {
        "startTime": r["startTime"],
        "settlementDate": r.get("settlementDate"),
        "settlementPeriod": r.get("settlementPeriod"),
        "generation": r["generation"],
        "publishTime": r.get("publishTime")
    }
    for r in raw_actual
    if r.get("fuelType") == "WIND"
]
print(f"Extracted {len(wind_actual)} WIND actual records")
with open(actual_cache_file, "w", encoding="utf-8") as f:
    json.dump(wind_actual, f, indent=2)
print(f"Saved to {actual_cache_file}")

print("\n--- Step 2: Fetching WINDFOR (Forecast Generation) ---")
# To ensure reliable download without HTTP timeout, let's fetch in weekly chunks or a single stream
# Let's test single stream first
url_fc = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishDateTimeFrom=2025-12-30T00:00:00Z&publishDateTimeTo=2026-02-02T23:59:59Z"
t0 = time.time()
req = urllib.request.Request(url_fc, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
with urllib.request.urlopen(req) as resp:
    raw_fc = json.loads(resp.read().decode())

print(f"Fetched {len(raw_fc)} WINDFOR records in {time.time()-t0:.2f}s")
wind_fc = [
    {
        "publishTime": r["publishTime"],
        "startTime": r["startTime"],
        "generation": r["generation"]
    }
    for r in raw_fc
]
with open(forecast_cache_file, "w", encoding="utf-8") as f:
    json.dump(wind_fc, f, indent=2)
print(f"Saved to {forecast_cache_file}")

# Quick summary
df_act = pd.DataFrame(wind_actual)
df_fc = pd.DataFrame(wind_fc)
print("\n--- Summary Statistics ---")
print(f"Actual wind records: {len(df_act)}, Start: {df_act['startTime'].min()} -> End: {df_act['startTime'].max()}")
print(f"Actual wind generation MW: min={df_act['generation'].min()}, mean={df_act['generation'].mean():.1f}, max={df_act['generation'].max()}")
print(f"Forecast records: {len(df_fc)}, Pub min: {df_fc['publishTime'].min()} -> Pub max: {df_fc['publishTime'].max()}")
print(f"Forecast generation MW: min={df_fc['generation'].min()}, mean={df_fc['generation'].mean():.1f}, max={df_fc['generation'].max()}")
print("Golden dataset successfully saved!")
