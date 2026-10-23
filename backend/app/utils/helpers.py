from datetime import datetime, timezone, timedelta
from typing import Tuple

def parse_utc_iso(dt_str: str) -> datetime:
    """Parse ISO timestamp with Z or timezone offset into a UTC datetime."""
    if not dt_str:
        return None
    # Normalize Z to +00:00
    cleaned = dt_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(cleaned)
    return dt.astimezone(timezone.utc)

def get_settlement_period(dt: datetime) -> int:
    """
    In the UK, settlement periods are 30-minute blocks starting at 00:00 GMT:
    Period 1: 00:00 - 00:30
    Period 2: 00:30 - 01:00
    ...
    Period 48: 23:30 - 24:00
    """
    total_minutes = dt.hour * 60 + dt.minute
    return (total_minutes // 30) + 1

def is_peak_settlement_period(sp: int) -> bool:
    """
    UK Electricity Peak Periods:
    SPs 15 through 38 correspond to 07:00 - 19:00 GMT.
    Peak demand and wholesale prices occur during these hours.
    """
    return 15 <= sp <= 38

def get_day_ahead_cutoff(delivery_date: datetime, cutoff_hour: int = 11) -> datetime:
    """
    Calculate the Day-Ahead decision cut-off timestamp (D-1 at cutoff_hour:00:00Z).
    e.g. For delivery day 2026-01-02, cut-off is 2026-01-01 at 11:00:00Z.
    """
    d_minus_1 = delivery_date - timedelta(days=1)
    return datetime(
        year=d_minus_1.year,
        month=d_minus_1.month,
        day=d_minus_1.day,
        hour=cutoff_hour,
        minute=0,
        second=0,
        tzinfo=timezone.utc
    )
