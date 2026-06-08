"""Unit tests for the 5 MCP tools (World Bank API calls are mocked)."""
import json
import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock

# ---------------------------------------------------------------------------
# Helpers to build fake World Bank responses
# ---------------------------------------------------------------------------

def _wb_country_response():
    return [
        {"page": 1, "pages": 1, "per_page": 50, "total": 1},
        [
            {
                "id": "CI",
                "name": "Côte d'Ivoire",
                "capitalCity": "Yamoussoukro",
                "region": {"value": "Sub-Saharan Africa"},
                "incomeLevel": {"value": "Lower middle income"},
                "longitude": "-5.54708",
                "latitude": "7.53999",
            }
        ],
    ]


def _wb_indicators_response():
    return [
        {"page": 1, "pages": 5, "per_page": 10, "total": 42},
        [
            {
                "id": "NY.GDP.MKTP.CD",
                "name": "GDP (current US$)",
                "source": {"value": "World Development Indicators"},
                "topics": [{"value": "Economy & Growth"}],
            }
        ],
    ]


def _wb_timeseries_response(indicator_id: str = "NY.GDP.MKTP.CD"):
    return [
        {"page": 1, "pages": 3, "per_page": 10, "total": 30},
        [
            {
                "indicator": {"id": indicator_id, "value": "GDP (current US$)"},
                "country": {"id": "CI", "value": "Côte d'Ivoire"},
                "date": "2022",
                "value": 70020000000.0,
            },
            {
                "indicator": {"id": indicator_id, "value": "GDP (current US$)"},
                "country": {"id": "CI", "value": "Côte d'Ivoire"},
                "date": "2021",
                "value": 61350000000.0,
            },
        ],
    ]


def _make_mock_response(data):
    mock_resp = MagicMock()
    mock_resp.json.return_value = data
    mock_resp.raise_for_status = MagicMock()
    return mock_resp


# ---------------------------------------------------------------------------
# get_country_profile
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_country_profile_success():
    from tools.country_profile import get_country_profile

    mock_resp = _make_mock_response(_wb_country_response())

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await get_country_profile("CI")

    assert result["id"] == "CI"
    assert result["name"] == "Côte d'Ivoire"
    assert result["capital_city"] == "Yamoussoukro"
    assert result["region"] == "Sub-Saharan Africa"
    assert result["income_level"] == "Lower middle income"


@pytest.mark.asyncio
async def test_get_country_profile_not_found():
    from tools.country_profile import get_country_profile

    mock_resp = MagicMock()
    mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
        "404", request=MagicMock(), response=MagicMock(status_code=404)
    )

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await get_country_profile("XX")

    assert "error" in result
    assert result["code"] == 404


@pytest.mark.asyncio
async def test_get_country_profile_network_error():
    from tools.country_profile import get_country_profile

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(side_effect=httpx.ConnectError("timeout"))
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await get_country_profile("CI")

    assert "error" in result
    assert result["code"] == 503


# ---------------------------------------------------------------------------
# search_indicators
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_search_indicators_success():
    from tools.search_indicators import search_indicators

    mock_resp = _make_mock_response(_wb_indicators_response())

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await search_indicators("GDP")

    assert result["total"] == 42
    assert len(result["indicators"]) == 1
    assert result["indicators"][0]["id"] == "NY.GDP.MKTP.CD"


@pytest.mark.asyncio
async def test_search_indicators_empty_results():
    from tools.search_indicators import search_indicators

    empty_response = [{"page": 1, "pages": 0, "per_page": 10, "total": 0}, None]
    mock_resp = _make_mock_response(empty_response)

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await search_indicators("zzznomatch")

    assert result["total"] == 0
    assert result["indicators"] == []


# ---------------------------------------------------------------------------
# get_economic_indicators
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_economic_indicators_success():
    from tools.economic_indicators import get_economic_indicators

    mock_resp = _make_mock_response(_wb_timeseries_response("NY.GDP.MKTP.CD"))

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await get_economic_indicators("NY.GDP.MKTP.CD", per_page=10)

    assert result["indicator"]["id"] == "NY.GDP.MKTP.CD"
    assert len(result["data"]) == 2
    assert result["data"][0]["year"] == "2022"
    assert result["data"][0]["value"] == pytest.approx(70020000000.0)


@pytest.mark.asyncio
async def test_get_economic_indicators_null_values():
    """Null data points (years with no data) must be preserved, not dropped."""
    from tools.economic_indicators import get_economic_indicators

    response = [
        {"page": 1, "pages": 1, "per_page": 10, "total": 1},
        [
            {
                "indicator": {"id": "NY.GDP.MKTP.CD", "value": "GDP"},
                "country": {"id": "CI", "value": "Côte d'Ivoire"},
                "date": "2023",
                "value": None,
            }
        ],
    ]
    mock_resp = _make_mock_response(response)

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await get_economic_indicators("NY.GDP.MKTP.CD")

    assert result["data"][0]["value"] is None


# ---------------------------------------------------------------------------
# get_education_indicators
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_education_indicators_success():
    from tools.education_indicators import get_education_indicators

    mock_resp = _make_mock_response(_wb_timeseries_response("SE.PRM.ENRR"))

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await get_education_indicators("SE.PRM.ENRR")

    assert result["indicator"]["id"] == "SE.PRM.ENRR"
    assert len(result["data"]) == 2


# ---------------------------------------------------------------------------
# get_health_indicators
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_health_indicators_success():
    from tools.health_indicators import get_health_indicators

    mock_resp = _make_mock_response(_wb_timeseries_response("SP.DYN.LE00.IN"))

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await get_health_indicators("SP.DYN.LE00.IN")

    assert result["indicator"]["id"] == "SP.DYN.LE00.IN"
    assert result["data"][0]["year"] == "2022"
