"""FastMCP server — all 5 tools registered via @mcp.tool()."""
from fastmcp import FastMCP

from tools.country_profile import get_country_profile
from tools.economic_indicators import get_economic_indicators
from tools.education_indicators import get_education_indicators
from tools.health_indicators import get_health_indicators
from tools.search_indicators import search_indicators

mcp = FastMCP(
    name="Ivoire Data Assistant",
    instructions=(
        "AI assistant specialized in Côte d'Ivoire development data. "
        "Answers in French or English depending on the user's language. "
        "All data sourced from the World Bank API."
    ),
)

mcp.tool()(get_country_profile)
mcp.tool()(search_indicators)
mcp.tool()(get_economic_indicators)
mcp.tool()(get_education_indicators)
mcp.tool()(get_health_indicators)
