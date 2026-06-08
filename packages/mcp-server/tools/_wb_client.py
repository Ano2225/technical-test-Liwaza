"""Thin async wrapper around the World Bank REST API v2."""
import logging
from typing import Any

import httpx

WB_BASE = "https://api.worldbank.org/v2"
_TIMEOUT = 15.0
logger = logging.getLogger(__name__)


async def wb_get(path: str, params: dict[str, Any] | None = None) -> Any:
    """
    GET {WB_BASE}/{path} and return the parsed JSON body.

    The World Bank always returns a two-element list:
      [0] metadata dict  (pagination info / error info)
      [1] data payload   (list of records, or None on error)

    Raises httpx.HTTPStatusError on non-2xx HTTP responses.
    Raises ValueError when the API signals a data-level error.
    """
    default_params: dict[str, Any] = {"format": "json"}
    if params:
        default_params.update(params)

    url = f"{WB_BASE}/{path.lstrip('/')}"
    logger.debug("WB API GET %s params=%s", url, default_params)

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.get(url, params=default_params)
        response.raise_for_status()

    data = response.json()

    # The API wraps errors in the metadata element
    if isinstance(data, list) and len(data) >= 1:
        meta = data[0]
        if isinstance(meta, dict) and "message" in meta:
            messages = meta["message"]
            if isinstance(messages, list) and messages:
                err = messages[0]
                raise ValueError(f"World Bank API error {err.get('id', '?')}: {err.get('value', 'unknown')}")

    return data
