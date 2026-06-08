"""LLM orchestration: drives Claude with tool_use, tool schemas read from the MCP registry."""
import json
import logging
from typing import Any

import anthropic

from config import settings
from mcp_app import mcp
from tools import (
    get_country_profile,
    get_economic_indicators,
    get_education_indicators,
    get_health_indicators,
    search_indicators,
)

TOOL_HANDLERS = {
    "get_country_profile": get_country_profile,
    "search_indicators": search_indicators,
    "get_economic_indicators": get_economic_indicators,
    "get_education_indicators": get_education_indicators,
    "get_health_indicators": get_health_indicators,
}

logger = logging.getLogger(__name__)

_client: anthropic.AsyncAnthropic | None = None
MODEL = "claude-sonnet-4-6"


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set. Check your .env file.")
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client
MAX_TOKENS = 4096

SYSTEM_PROMPT = """You are the Ivoire Data Assistant, an AI specialized in Côte d'Ivoire development data.
You help citizens, researchers, NGOs, and policymakers explore publicly available World Bank data.
Answer in the same language the user writes in (French or English).
Always cite the data source (World Bank) and the year of the most recent data point you reference.
When presenting numbers, format them clearly (e.g., "1.5 trillion USD" rather than "1500000000000").
If data is unavailable or a request is outside scope, say so clearly rather than guessing."""


def _build_anthropic_tools() -> list[dict[str, Any]]:
    """Convert FastMCP tool registry into Anthropic tool_use schema format."""
    tools = []
    for tool in mcp._tool_manager.list_tools():
        tools.append({
            "name": tool.name,
            "description": tool.description or "",
            "input_schema": tool.parameters,
        })
    return tools


async def chat(messages: list[dict[str, str]]) -> dict[str, Any]:
    """
    Run one agentic turn: send messages to Claude, execute any tool calls,
    and return the final text response along with tool_use metadata.
    """
    anthropic_tools = _build_anthropic_tools()
    anthropic_messages = [{"role": m["role"], "content": m["content"]} for m in messages]
    tool_calls_made: list[dict[str, Any]] = []

    client = _get_client()
    response = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        tools=anthropic_tools,
        messages=anthropic_messages,
    )
    logger.debug("LLM response stop_reason=%s", response.stop_reason)

    while response.stop_reason == "tool_use":
        tool_results = []

        for block in response.content:
            if block.type != "tool_use":
                continue

            tool_name = block.name
            tool_input = block.input
            logger.info("Tool call: %s(%s)", tool_name, json.dumps(tool_input, ensure_ascii=False)[:200])

            handler = TOOL_HANDLERS.get(tool_name)
            if handler is None:
                result: dict[str, Any] = {"error": f"Unknown tool: {tool_name}", "code": 400}
            else:
                try:
                    result = await handler(**tool_input)
                except Exception as exc:  # noqa: BLE001
                    logger.exception("Tool %s raised an exception", tool_name)
                    result = {"error": str(exc), "code": 500}

            tool_calls_made.append({"tool": tool_name, "input": tool_input, "result": result})
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result, ensure_ascii=False),
            })

        anthropic_messages = [
            *anthropic_messages,
            {"role": "assistant", "content": response.content},
            {"role": "user", "content": tool_results},
        ]
        response = await client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            tools=anthropic_tools,
            messages=anthropic_messages,
        )
        logger.debug("LLM follow-up stop_reason=%s", response.stop_reason)

    final_text = "".join(
        block.text for block in response.content if hasattr(block, "text")
    )
    return {"reply": final_text, "tool_calls": tool_calls_made}
