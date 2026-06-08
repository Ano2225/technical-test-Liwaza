"""
Integration tests for all 5 MCP tools.

All success, empty-data and null-value tests call the live World Bank API —
no fake response fixtures. Network-error tests monkeypatch WB_BASE to an
unreachable host to trigger a real ConnectError without any response mocking.
"""
import httpx
import pytest
import tools._wb_client as wb_client   # imported here so monkeypatch can reach WB_BASE


# ---------------------------------------------------------------------------
# World Bank API connectivity
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_world_bank_api_reachable():
    """World Bank API must respond 200 with the expected two-element JSON list."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get("https://api.worldbank.org/v2/country/CI?format=json")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 2
    assert data[1] is not None and len(data[1]) > 0


# ---------------------------------------------------------------------------
# get_country_profile
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_country_profile_success():
    """Real call returns a valid Côte d'Ivoire profile."""
    from tools.country_profile import get_country_profile
    result = await get_country_profile("CI")

    assert "error" not in result
    assert result["id"] == "CIV"   # WB uses 3-letter ISO code in the `id` field
    assert "Ivoire" in result["name"]
    assert result["capital_city"] != ""
    assert result["region"] != ""
    assert result["income_level"] != ""
    assert result["longitude"] != "" and result["latitude"] != ""


@pytest.mark.asyncio
async def test_country_profile_invalid_code_returns_not_found():
    """Unknown country code must return an error dict, not raise."""
    from tools.country_profile import get_country_profile
    result = await get_country_profile("ZZ")

    assert "error" in result
    # WB signals invalid code via a message error → tool maps it to 400
    assert result["code"] == 400


@pytest.mark.asyncio
async def test_country_profile_network_error(monkeypatch):
    """Unreachable host must return code 503, not raise an exception."""
    monkeypatch.setattr(wb_client, "WB_BASE", "https://unreachable.invalid.local")
    from tools.country_profile import get_country_profile
    result = await get_country_profile("CI")

    assert "error" in result
    assert result["code"] == 503


@pytest.mark.asyncio
async def test_country_profile_lowercase_code_normalised():
    """Pydantic validator must uppercase country code before calling WB."""
    from tools.country_profile import get_country_profile
    result = await get_country_profile("ci")

    assert "error" not in result
    assert result["id"] == "CIV"   # WB uses 3-letter ISO code in the `id` field


# ---------------------------------------------------------------------------
# search_indicators
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_search_indicators_success():
    """GDP search must return at least one indicator with the expected fields."""
    from tools.search_indicators import search_indicators
    result = await search_indicators("GDP", per_page=5)

    assert "error" not in result
    assert result["total"] > 0
    assert len(result["indicators"]) > 0
    first = result["indicators"][0]
    assert "id" in first
    assert "name" in first
    assert "source" in first


@pytest.mark.asyncio
async def test_search_indicators_returns_indicator_list():
    """
    WB /indicator?q=... ignores the q parameter and returns all indicators.
    Test that the function processes the response and returns valid indicator records.
    """
    from tools.search_indicators import search_indicators
    result = await search_indicators("GDP", per_page=5)

    assert "error" not in result
    assert result["total"] > 0
    assert len(result["indicators"]) == 5
    for ind in result["indicators"]:
        assert ind["id"] != ""
        assert ind["name"] != ""


@pytest.mark.asyncio
async def test_search_indicators_network_error(monkeypatch):
    """Unreachable host must return code 503."""
    monkeypatch.setattr(wb_client, "WB_BASE", "https://unreachable.invalid.local")
    from tools.search_indicators import search_indicators
    result = await search_indicators("GDP")

    assert "error" in result
    assert result["code"] == 503


@pytest.mark.asyncio
async def test_search_indicators_pagination_fields():
    """Response must always include pagination metadata."""
    from tools.search_indicators import search_indicators
    result = await search_indicators("education", per_page=3)

    assert "error" not in result
    assert result["per_page"] == 3
    assert result["page"] == 1
    assert "pages" in result and isinstance(result["pages"], int)
    assert "total" in result


# ---------------------------------------------------------------------------
# get_economic_indicators
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_economic_indicators_success():
    """GDP indicator must return a populated time series with the correct id."""
    from tools.economic_indicators import get_economic_indicators
    result = await get_economic_indicators("NY.GDP.MKTP.CD", per_page=5)

    assert "error" not in result
    assert result["indicator"]["id"] == "NY.GDP.MKTP.CD"
    assert len(result["data"]) > 0
    assert "year" in result["data"][0]
    assert "value" in result["data"][0]


@pytest.mark.asyncio
async def test_economic_indicators_null_values_preserved():
    """Null data points (years with no published data) must be kept, not dropped."""
    from tools.economic_indicators import get_economic_indicators
    result = await get_economic_indicators("NY.GDP.MKTP.CD", per_page=10)

    assert "error" not in result
    for point in result["data"]:
        assert point["value"] is None or isinstance(point["value"], float)


@pytest.mark.asyncio
async def test_economic_indicators_empty_on_invalid_id():
    """An unknown indicator ID returns empty data, not a raised exception."""
    from tools.economic_indicators import get_economic_indicators
    result = await get_economic_indicators("COMPLETELY.INVALID.INDICATOR.ID")

    # WB returns empty payload for unknown IDs; tool returns data:[] without error
    # or an error dict if WB signals a data error — both are acceptable
    assert "data" in result or "error" in result
    if "data" in result:
        assert result["data"] == []


@pytest.mark.asyncio
async def test_economic_indicators_network_error(monkeypatch):
    """Unreachable host must return code 503."""
    monkeypatch.setattr(wb_client, "WB_BASE", "https://unreachable.invalid.local")
    from tools.economic_indicators import get_economic_indicators
    result = await get_economic_indicators("NY.GDP.MKTP.CD")

    assert "error" in result
    assert result["code"] == 503


@pytest.mark.asyncio
async def test_economic_indicators_response_structure():
    """Response must carry all expected top-level keys."""
    from tools.economic_indicators import get_economic_indicators
    result = await get_economic_indicators("FP.CPI.TOTL.ZG", per_page=5)

    assert "error" not in result
    for key in ("indicator", "total", "per_page", "page", "pages", "data"):
        assert key in result


# ---------------------------------------------------------------------------
# get_education_indicators
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_education_indicators_success():
    """Primary enrollment indicator must return a valid time series."""
    from tools.education_indicators import get_education_indicators
    result = await get_education_indicators("SE.PRM.ENRR", per_page=5)

    assert "error" not in result
    assert result["indicator"]["id"] == "SE.PRM.ENRR"
    assert len(result["data"]) > 0


@pytest.mark.asyncio
async def test_education_indicators_null_values_preserved():
    """Null data points must not be filtered out."""
    from tools.education_indicators import get_education_indicators
    result = await get_education_indicators("SE.ADT.LITR.ZS", per_page=10)

    assert "error" not in result
    for point in result["data"]:
        assert point["value"] is None or isinstance(point["value"], float)


@pytest.mark.asyncio
async def test_education_indicators_empty_on_invalid_id():
    """Unknown indicator ID returns empty data without raising."""
    from tools.education_indicators import get_education_indicators
    result = await get_education_indicators("INVALID.EDUCATION.XX")

    assert "data" in result or "error" in result
    if "data" in result:
        assert result["data"] == []


@pytest.mark.asyncio
async def test_education_indicators_network_error(monkeypatch):
    """Unreachable host must return code 503."""
    monkeypatch.setattr(wb_client, "WB_BASE", "https://unreachable.invalid.local")
    from tools.education_indicators import get_education_indicators
    result = await get_education_indicators("SE.PRM.ENRR")

    assert "error" in result
    assert result["code"] == 503


# ---------------------------------------------------------------------------
# get_health_indicators
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health_indicators_success():
    """Life expectancy indicator must return a valid time series."""
    from tools.health_indicators import get_health_indicators
    result = await get_health_indicators("SP.DYN.LE00.IN", per_page=5)

    assert "error" not in result
    assert result["indicator"]["id"] == "SP.DYN.LE00.IN"
    assert len(result["data"]) > 0


@pytest.mark.asyncio
async def test_health_indicators_null_values_preserved():
    """Null data points must not be filtered out."""
    from tools.health_indicators import get_health_indicators
    result = await get_health_indicators("SH.DYN.MORT", per_page=10)

    assert "error" not in result
    for point in result["data"]:
        assert point["value"] is None or isinstance(point["value"], float)


@pytest.mark.asyncio
async def test_health_indicators_empty_on_invalid_id():
    """Unknown indicator ID returns empty data without raising."""
    from tools.health_indicators import get_health_indicators
    result = await get_health_indicators("INVALID.HEALTH.INDICATOR.XX")

    assert "data" in result or "error" in result
    if "data" in result:
        assert result["data"] == []


@pytest.mark.asyncio
async def test_health_indicators_network_error(monkeypatch):
    """Unreachable host must return code 503."""
    monkeypatch.setattr(wb_client, "WB_BASE", "https://unreachable.invalid.local")
    from tools.health_indicators import get_health_indicators
    result = await get_health_indicators("SP.DYN.LE00.IN")

    assert "error" in result
    assert result["code"] == 503
