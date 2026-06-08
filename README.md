# Ivoire Data Assistant

An AI-native public data assistant that helps citizens, researchers, NGOs, and policymakers
explore Côte d'Ivoire development indicators through natural language.

Powered by the World Bank API and Claude Sonnet 4.6.

---

## Overview

Users interact with a conversational chat interface in French or English.
The system understands natural language requests, identifies the appropriate data tool,
fetches real data from the World Bank API, and returns structured, readable results.

**Example queries:**
- "Quel est le PIB de la Côte d'Ivoire ?"
- "Montre-moi le taux d'alphabétisation"
- "Quelle est l'espérance de vie ?"
- "Taux d'inflation ces 5 dernières années"
- "Cherche des indicateurs sur la pauvreté"

---

## Architecture

```
React Frontend (MCP Client)
        │
        │ HTTPS + JWT Bearer
        ▼
FastAPI MCP Server ──► Anthropic API (Claude Sonnet 4.6)
        │                   │
        │                   └── tool_use: selects and calls the right tool
        │ HTTPS (no auth)
        ▼
World Bank API (api.worldbank.org/v2)
```

See [docs/architecture.md](docs/architecture.md) for the full architecture decision document.

---

## Tech Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS       |
| Icons    | lucide-react                                      |
| Fonts    | Instrument Serif + DM Sans (Google Fonts)         |
| Backend  | Python 3.12 + FastAPI + fastmcp                   |
| Config   | pydantic-settings (auto-loads `.env`)             |
| LLM      | Claude Sonnet 4.6 (tool_use agentic loop)         |
| Auth     | JWT Bearer token (frontend ↔ MCP server)          |
| Deploy   | Vercel (frontend) + Render (backend)              |

---

## Project Structure

```
ivoire-data-assistant/
├── packages/
│   ├── mcp-server/
│   │   ├── main.py               # FastAPI app + REST endpoints
│   │   ├── mcp_app.py            # FastMCP instance + @mcp.tool() registrations
│   │   ├── llm.py                # Claude agentic loop (tool_use)
│   │   ├── auth.py               # JWT issue + verify
│   │   ├── config.py             # pydantic-settings (.env loader)
│   │   ├── tools/                # 5 World Bank tool functions
│   │   └── tests/                # 9 unit tests
│   └── frontend/
│       ├── src/
│       │   ├── components/       # Chat, ChatBubble, ToolCallBadge, IndicatorCard
│       │   └── lib/api.ts        # JWT fetch + /chat calls
│       └── vercel.json
├── docs/
│   ├── architecture.md
│   ├── ai-strategy.md
│   └── ai-disclosure.md
├── render.yaml                   # Render IaC for backend
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.11+ (tested with 3.12)
- Docker (optional, for full-stack run)

### Backend

```bash
cd packages/mcp-server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY and JWT_SECRET
uvicorn main:app --reload --port 8000
```

The server auto-loads `.env` via pydantic-settings — no `source .env` needed.

### Frontend

```bash
cd packages/frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:8000
npm run dev                # → http://localhost:5173
```

The frontend fetches a JWT automatically from `/auth/token` on first message.

### Docker (full stack)

```bash
# Create a root .env with your secrets
export ANTHROPIC_API_KEY=sk-ant-...
export JWT_SECRET=your-random-secret

docker-compose up --build
```

- Frontend: http://localhost:80
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

---

## Environment Variables

### Backend (`packages/mcp-server/.env`)

```env
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=your-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24
ALLOWED_ORIGINS=*
```

### Frontend (`packages/frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Health check |
| `POST` | `/auth/token` | — | Issue JWT |
| `POST` | `/chat` | JWT | LLM chat with tool_use |
| `GET` | `/tools/country-profile` | JWT | Direct tool access |
| `GET` | `/tools/search-indicators` | JWT | Direct tool access |
| `GET` | `/tools/economic-indicators` | JWT | Direct tool access |
| `GET` | `/tools/education-indicators` | JWT | Direct tool access |
| `GET` | `/tools/health-indicators` | JWT | Direct tool access |
| `*` | `/mcp/*` | — | MCP protocol (streamable-http) |

Interactive docs: http://localhost:8000/docs

---

## MCP Tools

| Tool | Description | Key indicator IDs |
|---|---|---|
| `get_country_profile` | General info (capital, region, income level) | — |
| `search_indicators` | Search WB indicators by keyword | — |
| `get_economic_indicators` | GDP, inflation, exports | `NY.GDP.MKTP.CD`, `FP.CPI.TOTL.ZG` |
| `get_education_indicators` | Enrollment, literacy | `SE.PRM.ENRR`, `SE.ADT.LITR.ZS` |
| `get_health_indicators` | Mortality, life expectancy | `SH.DYN.MORT`, `SP.DYN.LE00.IN` |

Claude selects which tool to call automatically based on the user's question.

---

## Deployment

### Step 1 — Deploy backend to Render

### Step 2 — Deploy frontend to Vercel


### Step 3 — Lock CORS (optional but recommended)

In Render dashboard, set:
```
ALLOWED_ORIGINS=https://ivoire-data-assistant.vercel.app
```

Then redeploy the backend.

---

## Testing

```bash
cd packages/mcp-server
.venv/bin/pytest tests/ -v
# 14 tests, all passing
```

### Test strategy

Tests focus on **logic**, not data. The question is not "does the World Bank return the right GDP value" — it is "does the tool behave correctly when given valid input, invalid input, or a failing API".

**What is tested:**

- **Input validation** — Pydantic models enforce rules: `country_code` is auto-uppercased, `keyword` is stripped, `per_page` is clamped within bounds, empty `indicator_id` is rejected. These run with zero network calls.
- **Error handling paths** — httpx is mocked to raise `HTTPStatusError(404)` or `ConnectError`. Tests assert the tool returns a structured `{"error": "...", "code": 404/503}` dict — not an exception.
- **Data invariants** — null data points (years with no World Bank data) must be preserved as `null` in the output, not dropped. Tested directly on `_indicator_base.fetch_indicator`.
- **Auth logic** — JWT create → verify roundtrip; invalid token raises HTTP 401.

**What is not tested:**
- The Claude agentic loop (`llm.py`) — requires a live Anthropic API key and incurs cost
- Frontend components — TypeScript strict mode + `npm run build` catches type errors at build time
- End-to-end — covered manually against the running server

---

## Assumptions & Tradeoffs

- **World Bank API** over FNE/DGI/GUCE: FNE requires an Ivorian NCC business number even for the test environment. DGI and GUCE have no publicly documented REST API. The World Bank API is fully public, well-documented, and contains official Ivorian government data.
- **Monorepo**: Single developer, 3-day timeline, one reviewer. The overhead of two repositories outweighs the benefits at this scale.
- **JWT auth between frontend and backend**: Protects the Anthropic API key (never sent to the browser) and prevents abuse of the `/chat` endpoint.
- **No conversation persistence**: Messages are held in React state only. This avoids a database dependency and keeps the system stateless — appropriate for a demo/MVP.
- **Claude Sonnet 4.6 over Opus**: 5x cheaper, similar tool_use reliability for data lookup tasks. Opus reserved for complex multi-step analysis.
- **Tool functions called directly** (not via MCP protocol): `mcp._tool_manager.call_tool()` returns inconsistent types across fastmcp versions. Direct function calls are explicit and testable.

---

## Future Improvements

- Regional comparison mode (Côte d'Ivoire vs Ghana, Senegal, Nigeria)
- Redis caching for World Bank responses (data updates yearly — safe to cache 24h)
- Conversation history with PostgreSQL + user accounts
- Data visualization charts (recharts / D3)
- Voice input for low-literacy users
- Model routing: Haiku for simple queries, Sonnet for analysis, Opus for reports
- PWA support for mobile users in low-connectivity areas

---

## AI Usage Disclosure

See [docs/ai-disclosure.md](docs/ai-disclosure.md).

---

## AI Strategy

See [docs/ai-strategy.md](docs/ai-strategy.md).
