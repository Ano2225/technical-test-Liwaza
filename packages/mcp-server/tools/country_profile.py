import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from pydantic import BaseModel, field_validator

from ._wb_client import wb_get

logger = logging.getLogger(__name__)


class CountryProfileInput(BaseModel):
    country_code: str = "CI"

    @field_validator("country_code")
    @classmethod
    def upper_code(cls, v: str) -> str:
        return v.strip().upper()


class CountryProfileOutput(BaseModel):
    id: str
    name: str
    capital_city: str
    region: str
    income_level: str
    longitude: str
    latitude: str


async def get_country_profile(country_code: str = "CI") -> dict[str, Any]:
    """
    Return general information about a country from the World Bank.

    Args:
        country_code: ISO 3166-1 alpha-2 country code. Defaults to CI (Côte d'Ivoire).

    Returns a dict with id, name, capital_city, region, income_level, longitude, latitude.
    On error, returns a dict with 'error' and 'code' keys.
    """
    inp = CountryProfileInput(country_code=country_code)
    started_at = datetime.now(timezone.utc)
    logger.info("[%s] get_country_profile country_code=%s", started_at.isoformat(), inp.country_code)

    try:
        data = await wb_get(f"country/{inp.country_code}")
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        logger.error("WB HTTP error %s for country %s", status, inp.country_code)
        if status == 404:
            return {"error": f"Country '{inp.country_code}' not found.", "code": 404}
        return {"error": "World Bank API returned an error.", "code": status}
    except httpx.RequestError as exc:
        logger.error("WB request error: %s", exc)
        return {"error": "Could not reach the World Bank API.", "code": 503}
    except ValueError as exc:
        logger.error("WB data error: %s", exc)
        return {"error": str(exc), "code": 400}

    records = data[1] if isinstance(data, list) and len(data) > 1 else []
    if not records:
        return {"error": f"No data found for country '{inp.country_code}'.", "code": 404}

    record = records[0]
    try:
        profile = CountryProfileOutput(
            id=record.get("id", ""),
            name=record.get("name", ""),
            capital_city=record.get("capitalCity", ""),
            region=record.get("region", {}).get("value", ""),
            income_level=record.get("incomeLevel", {}).get("value", ""),
            longitude=record.get("longitude", ""),
            latitude=record.get("latitude", ""),
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Validation error mapping country profile: %s", exc)
        return {"error": "Unexpected data format from World Bank API.", "code": 500}

    elapsed = (datetime.now(timezone.utc) - started_at).total_seconds()
    logger.info("get_country_profile completed in %.2fs", elapsed)
    return profile.model_dump()
