"""Shared logic for tools that fetch time-series indicator data for Côte d'Ivoire."""
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from pydantic import BaseModel, Field

from ._wb_client import wb_get

logger = logging.getLogger(__name__)

COUNTRY_CODE = "CI"


class IndicatorRequest(BaseModel):
    indicator_id: str = Field(..., min_length=1)
    per_page: int = Field(10, ge=1, le=100)
    page: int = Field(1, ge=1)


class IndicatorDataPoint(BaseModel):
    year: str | None
    value: float | None


async def fetch_indicator(
    tool_name: str,
    indicator_id: str,
    per_page: int = 10,
    page: int = 1,
) -> dict[str, Any]:
    req = IndicatorRequest(indicator_id=indicator_id.strip(), per_page=per_page, page=page)
    started_at = datetime.now(timezone.utc)
    logger.info(
        "[%s] %s indicator_id=%s per_page=%d page=%d",
        started_at.isoformat(), tool_name, req.indicator_id, req.per_page, req.page,
    )

    path = f"country/{COUNTRY_CODE}/indicator/{req.indicator_id}"
    try:
        data = await wb_get(path, params={"per_page": req.per_page, "page": req.page})
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        logger.error("%s WB HTTP error %s", tool_name, status)
        if status == 404:
            return {"error": f"Indicator '{req.indicator_id}' not found.", "code": 404}
        return {"error": "World Bank API returned an error.", "code": status}
    except httpx.RequestError as exc:
        logger.error("%s WB request error: %s", tool_name, exc)
        return {"error": "Could not reach the World Bank API.", "code": 503}
    except ValueError as exc:
        logger.error("%s WB data error: %s", tool_name, exc)
        return {"error": str(exc), "code": 400}

    meta = data[0] if isinstance(data, list) and data else {}
    records = data[1] if isinstance(data, list) and len(data) > 1 else []
    if records is None:
        records = []

    data_points = []
    for r in records:
        try:
            data_points.append(
                IndicatorDataPoint(
                    year=r.get("date"),
                    value=float(r["value"]) if r.get("value") is not None else None,
                ).model_dump()
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("%s skipping malformed record: %s", tool_name, exc)

    elapsed = (datetime.now(timezone.utc) - started_at).total_seconds()
    logger.info("%s returned %d data points in %.2fs", tool_name, len(data_points), elapsed)

    indicator_meta: dict[str, Any] = {}
    if records:
        first = records[0]
        indicator_meta = {
            "id": first.get("indicator", {}).get("id", req.indicator_id),
            "name": first.get("indicator", {}).get("value", ""),
            "country": first.get("country", {}).get("value", "Côte d'Ivoire"),
        }

    return {
        "indicator": indicator_meta,
        "total": meta.get("total", len(data_points)),
        "per_page": meta.get("per_page", req.per_page),
        "page": meta.get("page", req.page),
        "pages": meta.get("pages", 1),
        "data": data_points,
    }
