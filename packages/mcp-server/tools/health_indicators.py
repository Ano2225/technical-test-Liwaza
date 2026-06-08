from typing import Any

from pydantic import BaseModel, Field

from ._indicator_base import fetch_indicator

HEALTH_INDICATORS = {
    "SH.DYN.MORT": "Child mortality rate (per 1,000 live births)",
    "SP.DYN.LE00.IN": "Life expectancy at birth (years)",
    "SH.HIV.INCD.ZS": "HIV incidence rate (per 1,000 uninfected)",
}


class HealthIndicatorInput(BaseModel):
    indicator_id: str = Field("SP.DYN.LE00.IN")
    per_page: int = Field(10, ge=1, le=100)
    page: int = Field(1, ge=1)


async def get_health_indicators(
    indicator_id: str = "SP.DYN.LE00.IN",
    per_page: int = 10,
    page: int = 1,
) -> dict[str, Any]:
    """
    Fetch health time-series data for Côte d'Ivoire from the World Bank.

    Args:
        indicator_id: World Bank indicator ID. Common values:
            SH.DYN.MORT    — Child mortality rate (per 1,000 live births)
            SP.DYN.LE00.IN — Life expectancy at birth (total years)
            SH.HIV.INCD.ZS — HIV incidence rate (per 1,000 uninfected population)
        per_page: Number of yearly data points to return (1–100). Defaults to 10.
        page: Page number. Defaults to 1.

    Returns a dict with keys: indicator (id, name, country), total, per_page, page, pages, data.
    Each data point has: year, value (float or null if data unavailable for that year).
    """
    inp = HealthIndicatorInput(indicator_id=indicator_id, per_page=per_page, page=page)
    return await fetch_indicator(
        tool_name="get_health_indicators",
        indicator_id=inp.indicator_id,
        per_page=inp.per_page,
        page=inp.page,
    )
