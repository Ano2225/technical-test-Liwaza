"""
Tests for MCP tool logic: input validation, error handling, auth, data invariants.
World Bank API is mocked only where needed to trigger specific code paths.
"""
import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch
from pydantic import ValidationError


# ── Helpers ───────────────────────────────────────────────────────────────────

def _http_error(status_code: int):
    mock_resp = MagicMock()
    mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
        str(status_code), request=MagicMock(), response=MagicMock(status_code=status_code)
    )
    return mock_resp


def _network_error():
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=httpx.ConnectError("unreachable"))
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    return patch("httpx.AsyncClient", return_value=mock_client)


def _http_mock(mock_response):
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    return patch("httpx.AsyncClient", return_value=mock_client)


# ── Input validation ──────────────────────────────────────────────────────────

def test_country_code_auto_uppercased():
    from tools.country_profile import CountryProfileInput
    assert CountryProfileInput(country_code="ci").country_code == "CI"
    assert CountryProfileInput(country_code="  ci  ").country_code == "CI"


def test_country_code_defaults_to_ci():
    from tools.country_profile import CountryProfileInput
    assert CountryProfileInput().country_code == "CI"


def test_search_keyword_stripped():
    from tools.search_indicators import SearchIndicatorsInput
    assert SearchIndicatorsInput(keyword="  GDP  ").keyword == "GDP"


def test_search_empty_keyword_rejected():
    from tools.search_indicators import SearchIndicatorsInput
    with pytest.raises(ValidationError):
        SearchIndicatorsInput(keyword="")


def test_search_per_page_bounds():
    from tools.search_indicators import SearchIndicatorsInput
    with pytest.raises(ValidationError):
        SearchIndicatorsInput(keyword="GDP", per_page=0)
    with pytest.raises(ValidationError):
        SearchIndicatorsInput(keyword="GDP", per_page=51)


def test_indicator_per_page_bounds():
    from tools._indicator_base import IndicatorRequest
    with pytest.raises(ValidationError):
        IndicatorRequest(indicator_id="NY.GDP.MKTP.CD", per_page=0)
    with pytest.raises(ValidationError):
        IndicatorRequest(indicator_id="NY.GDP.MKTP.CD", per_page=101)


def test_indicator_empty_id_rejected():
    from tools._indicator_base import IndicatorRequest
    with pytest.raises(ValidationError):
        IndicatorRequest(indicator_id="")


# ── Error handling ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_country_profile_404_returns_structured_error():
    from tools.country_profile import get_country_profile
    with _http_mock(_http_error(404)):
        result = await get_country_profile("XX")
    assert "error" in result
    assert result["code"] == 404


@pytest.mark.asyncio
async def test_country_profile_network_error_returns_503():
    from tools.country_profile import get_country_profile
    with _network_error():
        result = await get_country_profile("CI")
    assert "error" in result
    assert result["code"] == 503


@pytest.mark.asyncio
async def test_economic_indicators_404_returns_structured_error():
    from tools.economic_indicators import get_economic_indicators
    with _http_mock(_http_error(404)):
        result = await get_economic_indicators("INVALID.ID")
    assert "error" in result
    assert result["code"] == 404


@pytest.mark.asyncio
async def test_search_indicators_network_error_returns_503():
    from tools.search_indicators import search_indicators
    with _network_error():
        result = await search_indicators("GDP")
    assert "error" in result
    assert result["code"] == 503


# ── Data invariants ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_null_data_points_preserved_not_dropped():
    """Years with no WB data must come through as null, not be filtered out."""
    from tools._indicator_base import fetch_indicator

    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = [
        {"page": 1, "pages": 1, "per_page": 2, "total": 2},
        [
            {"indicator": {"id": "X", "value": "X"}, "country": {"id": "CI", "value": "CI"}, "date": "2023", "value": None},
            {"indicator": {"id": "X", "value": "X"}, "country": {"id": "CI", "value": "CI"}, "date": "2022", "value": 1.0},
        ],
    ]
    with _http_mock(mock_resp):
        result = await fetch_indicator("test", "X")

    assert len(result["data"]) == 2
    assert result["data"][0]["value"] is None
    assert result["data"][1]["value"] == pytest.approx(1.0)


# ── Auth logic ────────────────────────────────────────────────────────────────

def test_jwt_create_and_verify_roundtrip():
    from auth import create_access_token, verify_token
    from fastapi.security import HTTPAuthorizationCredentials

    token = create_access_token("test-subject")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    payload = verify_token(creds)
    assert payload.sub == "test-subject"


def test_invalid_jwt_raises_401():
    from auth import verify_token
    from fastapi import HTTPException
    from fastapi.security import HTTPAuthorizationCredentials

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="not.a.valid.token")
    with pytest.raises(HTTPException) as exc:
        verify_token(creds)
    assert exc.value.status_code == 401
