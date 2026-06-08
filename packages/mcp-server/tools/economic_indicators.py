from typing import Any

from pydantic import BaseModel, Field

from ._indicator_base import fetch_indicator

ECONOMIC_INDICATORS = {
    "NY.GDP.MKTP.CD": "GDP (current USD)",
    "NY.GDP.PCAP.CD": "GDP per capita (current USD)",
    "FP.CPI.TOTL.ZG": "Inflation, consumer prices (annual %)",
    "NE.EXP.GNFS.ZS": "Exports of goods and services (% of GDP)",
}


class EconomicIndicatorInput(BaseModel):
    indicator_id: str = Field("NY.GDP.MKTP.CD")
    per_page: int = Field(10, ge=1, le=100)
    page: int = Field(1, ge=1)


async def get_economic_indicators(
    indicator_id: str = "NY.GDP.MKTP.CD",
    per_page: int = 10,
    page: int = 1,
) -> dict[str, Any]:
    """
    Fetch economic time-series data for Côte d'Ivoire from the World Bank.

    Args:
        indicator_id: World Bank indicator ID. Common values:
            NY.GDP.MKTP.CD  — GDP (current USD)
            NY.GDP.PCAP.CD  — GDP per capita
            FP.CPI.TOTL.ZG  — Inflation rate (annual %)
            NE.EXP.GNFS.ZS  — Exports of goods and services (% of GDP)
        per_page: Number of yearly data points to return (1–100). Defaults to 10.
        page: Page number. Defaults to 1.

    Returns a dict with keys: indicator (id, name, country), total, per_page, page, pages, data.
    Each data point has: year, value (float or null if data unavailable for that year).
    """
    inp = EconomicIndicatorInput(indicator_id=indicator_id, per_page=per_page, page=page)
    return await fetch_indicator(
        tool_name="get_economic_indicators",
        indicator_id=inp.indicator_id,
        per_page=inp.per_page,
        page=inp.page,
    )
