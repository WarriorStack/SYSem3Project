from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status


def parse_date_param(value: Optional[str], field_name: str) -> Optional[datetime]:
    """Parse an ISO-8601 date/datetime query parameter, raising 400 on failure."""
    if value is None:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} format. Expected ISO-8601 (e.g. 2025-01-31).",
        )
