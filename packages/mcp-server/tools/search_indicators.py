import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from pydantic import BaseModel, Field, field_validator

from ._wb_client import wb_get

logger = logging.getLogger(__name__)


class SearchIndicatorsInput(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=200)
    per_page: int = Field(10, ge=1, le=50)
    page: int = Field(1, ge=1)

    @field_validator("keyword")
    @classmethod
    def strip_keyword(cls, v: str) -> str:
        return v.strip()


class IndicatorSummary(BaseModel):
    id: str
    name: str
    source: str
    topics: list[str]


async def search_indicators(
    keyword: str,
    per_page: int = 10,
    page: int = 1,
) -> dict[str, Any]:
    """
    Search World Bank indicators by keyword.

    Args:
        keyword: Search term, e.g. 'GDP', 'literacy', 'mortality'.
        per_page: Number of results per page (1–50). Defaults to 10.
        page: Page number. Defaults to 1.

    Returns a paginated dict with keys: total, per_page, page, pages, indicators.
    Each indicator has: id, name, source, topics.
    Use the returned indicator ids with the other fetch tools.
    """
    inp = SearchIndicatorsInput(keyword=keyword, per_page=per_page, page=page)
    started_at = datetime.now(timezone.utc)
    logger.info(
        "[%s] search_indicators keyword=%r per_page=%d page=%d",
        started_at.isoformat(), inp.keyword, inp.per_page, inp.page,
    )

    try:
        data = await wb_get(
            "indicator",
            params={"q": inp.keyword, "per_page": inp.per_page, "page": inp.page},
        )
    except httpx.HTTPStatusError as exc:
        logger.error("WB HTTP error %s searching indicators", exc.response.status_code)
        return {"error": "World Bank API returned an error.", "code": exc.response.status_code}
    except httpx.RequestError as exc:
        logger.error("WB request error: %s", exc)
        return {"error": "Could not reach the World Bank API.", "code": 503}
    except ValueError as exc:
        logger.error("WB data error: %s", exc)
        return {"error": str(exc), "code": 400}

    meta = data[0] if isinstance(data, list) and data else {}
    records = data[1] if isinstance(data, list) and len(data) > 1 else []

    if records is None:
        records = []

    indicators = []
    for r in records:
        try:
            topics = [t.get("value", "") for t in (r.get("topics") or []) if t.get("value")]
            indicators.append(
                IndicatorSummary(
                    id=r.get("id", ""),
                    name=r.get("name", ""),
                    source=r.get("source", {}).get("value", ""),
                    topics=topics,
                ).model_dump()
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Skipping malformed indicator record: %s", exc)

    elapsed = (datetime.now(timezone.utc) - started_at).total_seconds()
    logger.info("search_indicators returned %d results in %.2fs", len(indicators), elapsed)

    return {
        "total":    int(meta.get("total",    len(indicators))),
        "per_page": int(meta.get("per_page", inp.per_page)),
        "page":     int(meta.get("page",     inp.page)),
        "pages":    int(meta.get("pages",    1)),
        "indicators": indicators,
    }
