import logging
import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from auth import create_access_token, verify_token
from llm import chat
from mcp_app import mcp
from tools import (
    get_country_profile,
    get_economic_indicators,
    get_education_indicators,
    get_health_indicators,
    search_indicators,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Ivoire Data Assistant MCP Server starting up")
    registered = [t.name for t in mcp._tool_manager.list_tools()]
    logger.info("Registered MCP tools: %s", registered)
    yield
    logger.info("Ivoire Data Assistant MCP Server shutting down")


app = FastAPI(
    title="Ivoire Data Assistant — MCP Server",
    description="AI-native public data assistant for Côte d'Ivoire, powered by World Bank data.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the FastMCP server at /mcp — exposes the MCP protocol (streamable-http)
app.mount("/mcp", mcp.http_app())


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class TokenRequest(BaseModel):
    client_id: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@app.post("/auth/token", response_model=TokenResponse, tags=["auth"])
async def get_token(body: TokenRequest) -> TokenResponse:
    token = create_access_token(subject=body.client_id)
    logger.info("Issued token for client_id=%s", body.client_id)
    return TokenResponse(access_token=token)


# ---------------------------------------------------------------------------
# Chat (LLM orchestration)
# ---------------------------------------------------------------------------
class Message(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    messages: list[Message] = Field(..., min_length=1)


class ChatResponse(BaseModel):
    reply: str
    tool_calls: list[dict[str, Any]]


@app.post("/chat", response_model=ChatResponse, tags=["chat"])
async def chat_endpoint(
    body: ChatRequest,
    _token=Depends(verify_token),
) -> ChatResponse:
    try:
        result = await chat([m.model_dump() for m in body.messages])
    except Exception as exc:
        logger.exception("LLM orchestration error")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    return ChatResponse(**result)


# ---------------------------------------------------------------------------
# Direct tool endpoints (authenticated REST — for debugging / direct access)
# ---------------------------------------------------------------------------
@app.get("/tools/country-profile", tags=["tools"])
async def tool_country_profile(country_code: str = "CI", _token=Depends(verify_token)) -> dict[str, Any]:
    result = await get_country_profile(country_code=country_code)
    if "error" in result:
        raise HTTPException(status_code=result.get("code", 500), detail=result["error"])
    return result


@app.get("/tools/search-indicators", tags=["tools"])
async def tool_search_indicators(
    keyword: str, per_page: int = 10, page: int = 1, _token=Depends(verify_token)
) -> dict[str, Any]:
    result = await search_indicators(keyword=keyword, per_page=per_page, page=page)
    if "error" in result:
        raise HTTPException(status_code=result.get("code", 500), detail=result["error"])
    return result


@app.get("/tools/economic-indicators", tags=["tools"])
async def tool_economic_indicators(
    indicator_id: str = "NY.GDP.MKTP.CD", per_page: int = 10, page: int = 1, _token=Depends(verify_token)
) -> dict[str, Any]:
    result = await get_economic_indicators(indicator_id=indicator_id, per_page=per_page, page=page)
    if "error" in result:
        raise HTTPException(status_code=result.get("code", 500), detail=result["error"])
    return result


@app.get("/tools/education-indicators", tags=["tools"])
async def tool_education_indicators(
    indicator_id: str = "SE.PRM.ENRR", per_page: int = 10, page: int = 1, _token=Depends(verify_token)
) -> dict[str, Any]:
    result = await get_education_indicators(indicator_id=indicator_id, per_page=per_page, page=page)
    if "error" in result:
        raise HTTPException(status_code=result.get("code", 500), detail=result["error"])
    return result


@app.get("/tools/health-indicators", tags=["tools"])
async def tool_health_indicators(
    indicator_id: str = "SP.DYN.LE00.IN", per_page: int = 10, page: int = 1, _token=Depends(verify_token)
) -> dict[str, Any]:
    result = await get_health_indicators(indicator_id=indicator_id, per_page=per_page, page=page)
    if "error" in result:
        raise HTTPException(status_code=result.get("code", 500), detail=result["error"])
    return result


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
