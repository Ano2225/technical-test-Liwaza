# Ivoire Data Assistant

An AI-native public data assistant that helps citizens, researchers, NGOs, and policymakers
explore Côte d'Ivoire development indicators through natural language.

Powered by the World Bank API and Claude Sonnet 4.6.

---

## Overview

Users interact with a conversational chat interface in French or English.
The system understands natural language requests, identifies the appropriate data tool,
fetches real data from the World Bank API, and returns structured, readable results.

**Key features:**
- Conversational chat with persistent history (full context sent to Claude on each turn)
- FR/EN language switcher (persisted in `localStorage`, default: English)
- Help panel documenting all 5 tools with clickable example questions
- Expandable tool execution badges — shows which World Bank query was made and with what parameters
- All tool calls rendered per response (not just the first)
- Structured data cards: sparkline chart, trend arrow, latest value
- Copy-to-clipboard on every assistant message
- Inline error messages in the conversation flow
- Cycling loading status ("Fetching data…", "World Bank API…", …)
- "New conversation" button to clear context
- Fully responsive (mobile-first)

**Example queries:**
- "What is the GDP of Côte d'Ivoire?"
- "Show me the adult literacy rate"
- "What is the life expectancy?"
- "Inflation rate over the last 5 years"
- "Search for poverty indicators"

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
| Fonts    | Inter + Instrument Serif (Google Fonts)           |
| i18n     | Custom React context — English (default) + French |
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
│       │   ├── components/
│       │   │   ├── Chat.tsx            # Layout, state, FR/EN toggle
│       │   │   ├── ChatBubble.tsx      # Message renderer + copy button
│       │   │   ├── EmptyState.tsx      # Suggestion grid (i18n)
│       │   │   ├── HelpModal.tsx       # Tool documentation panel
│       │   │   ├── IndicatorCard.tsx   # Structured data cards
│       │   │   ├── ToolCallBadge.tsx   # Expandable tool execution badge
│       │   │   └── ui/                 # DataCard, LoadingBubble, LogoCircle, Sparkline
│       │   └── lib/
│       │       ├── api.ts              # JWT fetch + /chat calls
│       │       ├── formatters.ts       # formatValue, calcTrend (lang-aware)
│       │       ├── i18n.ts             # FR/EN translation strings
│       │       └── LanguageContext.tsx # Language context + useLang hook
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
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

> `ALLOWED_ORIGINS` must list exact origins — wildcards (`*`) are incompatible with
> `allow_credentials=True` and will cause CORS errors in the browser.

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

1. Go to [render.com](https://render.com) → New → BluePrints
2. Connect your GitHub repo (`Ano2225/technical-test-Liwaza`)
3. Render auto-detects `render.yaml` → click **Apply**
4. In the service settings, add environment variables:
   - `ANTHROPIC_API_KEY` → your Anthropic API key
   - `JWT_SECRET` → any random string (e.g. `openssl rand -hex 32`)
5. Deploy → wait for health check to pass
6. Copy the Render URL: `https://ivoire-data-backend.onrender.com`

### Step 2 — Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import `Ano2225/technical-test-Liwaza`
3. Set **Root Directory** to `packages/frontend`
4. Add environment variable:
   - `VITE_API_URL` → your Render backend URL from Step 1
5. Deploy → copy the Vercel URL: `https://ivoire-data-assistant.vercel.app`

### Step 3 — Lock CORS

`render.yaml` already sets `ALLOWED_ORIGINS` to the Vercel URL.
If your Vercel URL differs, update it in the Render dashboard under **Environment**:

```
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

Then trigger a manual redeploy.

---

## Testing

```bash
cd packages/mcp-server
.venv/bin/pytest tests/ -v
# 22 tests — live World Bank API (no mocks)
```

### Test strategy

**What is tested (22 tests, no mocks):**
- WB API reachability — confirms the live endpoint is up before running any tool test
- All 5 tool functions × (success path, invalid/empty data, null values, network error)
- Pagination metadata fields (`total`, `per_page`, `page`, `pages`) cast to correct types
- Network-error paths use `monkeypatch` to point `WB_BASE` at an unreachable host —
  a real `ConnectError` fires without any response fixture


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
