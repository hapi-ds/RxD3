"""
Utility functions for TaskJuggler scheduling.
"""

from datetime import datetime, timedelta
from typing import Optional


def parse_duration(duration_str: str) -> Optional[timedelta]:
    """Parse TaskJuggler duration string to timedelta."""
    import re

    if not duration_str:
        return None

    match = re.match(r'(\d+)\s*([wdmy])', duration_str.strip())

    if not match:
        return None

    value = int(match.group(1))
    unit = match.group(2)

    if unit == 'w':
        return timedelta(weeks=value)
    elif unit == 'd':
        return timedelta(days=value)
    elif unit == 'm':
        return timedelta(days=value * 30)
    elif unit == 'y':
        return timedelta(days=value * 365)

    return None


def parse_datetime(date_str: str) -> datetime:
    """Parse TaskJuggler date format to Python datetime."""
    import re

    date_str = re.sub(r'-\d{4}$', '', date_str).strip()

    try:
        return datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        raise ValueError(f"Cannot parse date: {date_str}")


def format_duration(td: timedelta) -> str:
    """Format timedelta as TaskJuggler duration string."""
    total_days = td.days

    if total_days % 365 == 0 and total_days >= 365:
        return f"{total_days // 365}y"
    elif total_days % 30 == 0 and total_days >= 30:
        return f"{total_days // 30}m"
    elif total_days % 7 == 0 and total_days >= 7:
        return f"{total_days // 7}w"
    else:
        return f"{total_days}d"


def calculate_end_date(start: datetime, duration: Optional[timedelta] = None,
                       length: Optional[timedelta] = None) -> Optional[datetime]:
    """Calculate end date from start and duration/length."""
    if not start:
        return None

    if length:
        return start + length
    elif duration:
        return start + duration

    return None


def calculate_duration(start: datetime, end: datetime) -> timedelta:
    """Calculate duration between two datetimes."""
    if not start or not end:
        return timedelta(0)

    return end - start


def get_business_days(start: datetime, end: datetime,
                      working_days: list[int] = None,
                      holidays: list[datetime] = None) -> int:
    """Count business days between two dates."""
    if working_days is None:
        working_days = [0, 1, 2, 3, 4]

    holidays_set = {h.date() for h in (holidays or [])}

    days = 0
    current = start.date()
    end_date = end.date()

    while current <= end_date:
        if current.weekday() in working_days and current not in holidays_set:
            days += 1
        current += timedelta(days=1)

    return days


def calculate_cost(duration_days: float, daily_rate: float,
                   efficiency: float = 1.0) -> float:
    """Calculate cost based on duration and rate."""
    return duration_days * daily_rate / efficiency


def adjust_for_non_working_days(date: datetime, working_days: list[int] = None,
                                 holidays: list[datetime] = None) -> datetime:
    """Adjust date to skip weekends and holidays."""
    if working_days is None:
        working_days = [0, 1, 2, 3, 4]

    while (
        date.weekday() not in working_days
        or (holidays and date.date() in [h.date() for h in holidays])
    ):
        date += timedelta(days=1)

    return date
