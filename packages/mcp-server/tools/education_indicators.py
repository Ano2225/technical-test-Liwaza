from typing import Any

from pydantic import BaseModel, Field

from ._indicator_base import fetch_indicator

EDUCATION_INDICATORS = {
    "SE.PRM.ENRR": "Primary school enrollment (% gross)",
    "SE.SEC.ENRR": "Secondary school enrollment (% gross)",
    "SE.ADT.LITR.ZS": "Adult literacy rate (% of people 15+)",
}


class EducationIndicatorInput(BaseModel):
    indicator_id: str = Field("SE.PRM.ENRR")
    per_page: int = Field(10, ge=1, le=100)
    page: int = Field(1, ge=1)


async def get_education_indicators(
    indicator_id: str = "SE.PRM.ENRR",
    per_page: int = 10,
    page: int = 1,
) -> dict[str, Any]:
    """
    Fetch education time-series data for Côte d'Ivoire from the World Bank.

    Args:
        indicator_id: World Bank indicator ID. Common values:
            SE.PRM.ENRR   — Primary school enrollment (% gross)
            SE.SEC.ENRR   — Secondary school enrollment (% gross)
            SE.ADT.LITR.ZS — Adult literacy rate (% of people ages 15+)
        per_page: Number of yearly data points to return (1–100). Defaults to 10.
        page: Page number. Defaults to 1.

    Returns a dict with keys: indicator (id, name, country), total, per_page, page, pages, data.
    Each data point has: year, value (float or null if data unavailable for that year).
    """
    inp = EducationIndicatorInput(indicator_id=indicator_id, per_page=per_page, page=page)
    return await fetch_indicator(
        tool_name="get_education_indicators",
        indicator_id=inp.indicator_id,
        per_page=inp.per_page,
        page=inp.page,
    )
