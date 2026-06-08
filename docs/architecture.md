# Architecture Decision Document

## Project: Ivoire Data Assistant

**Version:** 1.0  
**Date:** 2026-06-08  
**Author:** Ouattara Arouna

---

## 1. Current Architecture

### 1.1 Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  USER                                                                        ║
║  Browser — French or English                                                 ║
╚══════════════════════════════════════╦═══════════════════════════════════════╝
                                       ║  Human input
                                       ▼
╔══════════════════════════════════════════════════════════════════════════════╗
║  FRONTEND  (Vercel — CDN, global edge)                                       ║
║  React 18 + Vite + TypeScript + Tailwind CSS + lucide-react                  ║
║                                                                              ║
║  ┌──────────────────┐  ┌────────────────────┐  ┌───────────────────────┐   ║
║  │  Chat.tsx        │  │  ChatBubble.tsx     │  │  IndicatorCard.tsx    │   ║
║  │  - State mgmt    │  │  - Message render   │  │  - TimeSeriesCard     │   ║
║  │  - Send / recv   │  │  - ToolCallBadge    │  │  - CountryCard        │   ║
║  │  - Scroll        │  │  - Markdown text    │  │  - SearchCard         │   ║
║  └──────────────────┘  └────────────────────┘  └───────────────────────┘   ║
║                                                                              ║
║  ┌──────────────────────────────────────────────────────────────────────┐   ║
║  │  lib/api.ts  (HTTP client)                                           │   ║
║  │  - POST /auth/token  → stores JWT in localStorage                   │   ║
║  │  - POST /chat        → Authorization: Bearer <jwt>                  │   ║
║  │  - Auto token refresh on 401                                        │   ║
║  └──────────────────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════╦═══════════════════════════════════════╝
                                       ║  HTTPS
                                       ║  POST /chat
                                       ║  Authorization: Bearer <JWT>
                                       ▼
╔══════════════════════════════════════════════════════════════════════════════╗
║  MCP SERVER  (Render — Docker, free tier web service)                        ║
║  Python 3.11 + FastAPI + fastmcp + Pydantic + python-jose                   ║
║                                                                              ║
║  ┌──────────┐  ┌───────────────┐  ┌────────────────────────────────────┐   ║
║  │ auth.py  │  │   main.py     │  │  llm.py                            │   ║
║  │ JWT sign │  │ FastAPI app   │  │  Agentic loop (tool_use)           │   ║
║  │ JWT verify│  │ CORS          │  │  _build_anthropic_tools()         │   ║
║  │ Bearer   │  │ /auth/token   │  │  TOOL_HANDLERS dispatch            │   ║
║  │ scheme   │  │ /chat         │  │  Multi-turn until stop_reason≠     │   ║
║  └──────────┘  │ /tools/*      │  │  "tool_use"                        │   ║
║                │ /health       │  └────────────────────────────────────┘   ║
║                │ /mcp  (MCP)   │                                            ║
║                └───────────────┘                                            ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │  tools/  (MCP tool registry — @mcp.tool())                         │    ║
║  │  get_country_profile    → /v2/country/CI                           │    ║
║  │  search_indicators      → /v2/indicator?q=...                      │    ║
║  │  get_economic_indicators → /v2/country/CI/indicator/{id}           │    ║
║  │  get_education_indicators → /v2/country/CI/indicator/{id}          │    ║
║  │  get_health_indicators   → /v2/country/CI/indicator/{id}           │    ║
║  └─────────────────────────────────────────────────────────────────────┘    ║
╚══════════╦═════════════════════════════════════════╦════════════════════════╝
           ║  HTTPS                                  ║  HTTPS
           ║  tool_use calls                         ║  World Bank API calls
           ▼                                         ▼
╔══════════════════════╗              ╔══════════════════════════════════════╗
║  ANTHROPIC API       ║              ║  WORLD BANK API                      ║
║  claude-sonnet-4-6   ║              ║  api.worldbank.org/v2                ║
║  Max tokens: 4096    ║              ║  Public — no authentication          ║
║  Tool use enabled    ║              ║  Format: JSON                        ║
║  System prompt: FR/EN║              ║  Country: CI (Côte d'Ivoire)        ║
╚══════════════════════╝              ╚══════════════════════════════════════╝
```

---

### 1.2 Service Interactions

#### Authentication Flow (one-time per browser session)

```
Frontend                        MCP Server
   │                                │
   │── POST /auth/token ───────────►│
   │   { client_id: "frontend-demo" }│
   │                                │─ create_access_token(subject)
   │                                │  HS256, exp = now + 24h
   │◄── { access_token: "eyJ..." } ──│
   │                                │
   │  stores JWT in localStorage    │
```

The token is stateless (no session table, no database). Any `client_id` string
is accepted — the auth layer protects the Anthropic API from unauthenticated
abuse, not individual user accounts.

On a 401 response, the frontend automatically clears the cached token and
re-fetches a fresh one before retrying the original request (see `fetchWithAuth`
in `lib/api.ts`).

---

#### Chat Request Flow (every user message)

```
Browser          Frontend (api.ts)       MCP Server (main.py)    llm.py          Anthropic API    World Bank API
  │                    │                       │                    │                   │                 │
  │── send msg ───────►│                       │                    │                   │                 │
  │                    │── POST /chat ─────────►│                   │                   │                 │
  │                    │   Bearer <JWT>         │                    │                   │                 │
  │                    │   { messages: [...] }  │                    │                   │                 │
  │                    │                        │── verify_token()   │                   │                 │
  │                    │                        │── await chat() ───►│                   │                 │
  │                    │                        │                    │── messages.create ►│               │
  │                    │                        │                    │   model, tools     │               │
  │                    │                        │                    │◄── stop_reason:    │               │
  │                    │                        │                    │    "tool_use"      │               │
  │                    │                        │                    │                   │                 │
  │                    │                        │                    │── handler(**input)─────────────────►│
  │                    │                        │                    │                   │  GET /v2/...    │
  │                    │                        │                    │◄── JSON result ────────────────────│
  │                    │                        │                    │                   │                 │
  │                    │                        │                    │── messages.create ►│               │
  │                    │                        │                    │   + tool_result    │               │
  │                    │                        │                    │◄── stop_reason:    │               │
  │                    │                        │                    │    "end_turn"      │               │
  │                    │                        │◄── { reply, tool_calls } │             │               │
  │                    │◄── ChatResponse ────────│                   │                   │                 │
  │◄── render bubble ──│                        │                    │                   │                 │
```

**Multi-turn agentic loop:** `llm.py` loops `while response.stop_reason == "tool_use"`,
allowing Claude to call multiple tools in sequence (e.g., fetch country profile,
then GDP, then literacy rate in one user message).

---

#### MCP Protocol (secondary interface)

FastMCP mounts the MCP streamable-HTTP protocol at `/mcp`. This exposes the
5 tools as a standard MCP server for any compatible MCP client (Claude Desktop,
custom integrations). It is separate from the REST `/chat` endpoint used by the
frontend.

```
MCP Client          MCP Server (/mcp)
     │                     │
     │── MCP initialize ──►│  ← fastmcp handles protocol
     │── tools/list ───────►│  ← auto-generated from @mcp.tool()
     │── tools/call ───────►│  ← dispatched to Python functions
     │◄── result ───────────│
```

---

### 1.3 Deployment Topology

```
  Internet
      │
      ├──────────────────────────────────────────────────────┐
      │                                                      │
      ▼                                                      ▼
┌─────────────────────────────────┐          ┌──────────────────────────────┐
│  VERCEL (Frontend)              │          │  RENDER (Backend)            │
│  Global CDN — ~50 edge nodes    │          │  Region: Oregon (US West)    │
│                                 │          │  Runtime: Docker             │
│  Origin: GitHub (main branch)   │          │  Build: Dockerfile           │
│  Build: npm run build (Vite)    │          │                              │
│  Output: dist/ → static files   │          │  Container:                  │
│  SPA fallback: vercel.json      │          │  python:3.11-slim            │
│  rewrites /(.*) → /index.html   │          │  uvicorn + FastAPI           │
│                                 │          │  port: $PORT (Render-inject) │
│  Env vars (build time):         │          │                              │
│  VITE_API_URL=https://...render │          │  Env vars (runtime):         │
│                                 │          │  ANTHROPIC_API_KEY (secret)  │
└─────────────────────────────────┘          │  JWT_SECRET (secret)         │
                                             │  ALLOWED_ORIGINS=*           │
                                             │                              │
                                             │  Health check: GET /health   │
                                             │  Auto-deploy: render.yaml    │
                                             └──────────────────────────────┘

Local Development:
  docker-compose up
  ├── backend  → http://localhost:8000
  └── frontend → http://localhost:80
      (VITE_API_URL=http://localhost:8000 set as build arg)
```

**Free-tier constraints:**
- Render web services sleep after 15 minutes of inactivity → ~30s cold start on first request
- Vercel free tier: 100 GB bandwidth/month, unlimited deployments
- No persistent storage on either platform (stateless architecture by design)

---

### 1.4 Data Flow

#### Full request lifecycle

```
1. USER INPUT
   User types: "Quel est le PIB de la Côte d'Ivoire ?"
   Browser → React state (input textarea)

2. FRONTEND → BACKEND
   POST https://ivoire-data-backend.onrender.com/chat
   Headers: Authorization: Bearer eyJ...
   Body:    { messages: [{ role: "user", content: "Quel est le PIB..." }] }

3. JWT VALIDATION (auth.py)
   python-jose decodes HS256 token
   Checks exp field
   Returns TokenPayload(sub, exp) or raises HTTP 401

4. LLM FIRST CALL (llm.py → Anthropic API)
   POST api.anthropic.com/v1/messages
   model:   claude-sonnet-4-6
   system:  SYSTEM_PROMPT (FR/EN bilingual, World Bank source citation)
   tools:   [ get_economic_indicators, ... ] ← auto-built from fastmcp registry
   messages: [{ role: "user", content: "Quel est le PIB..." }]

5. CLAUDE TOOL SELECTION
   stop_reason: "tool_use"
   tool_name:   "get_economic_indicators"
   tool_input:  { indicator_id: "NY.GDP.MKTP.CD", per_page: 10, page: 1 }

6. TOOL EXECUTION (tools/economic_indicators.py)
   GET https://api.worldbank.org/v2/country/CI/indicator/NY.GDP.MKTP.CD
       ?format=json&per_page=10&page=1
   Response: JSON array [metadata, [{ value: 70.05e9, date: "2023" }, ...]]

7. TOOL RESULT PROCESSING
   Parsed into TimeSeriesData schema
   Appended as tool_result message in conversation

8. LLM SECOND CALL
   Same model + tools + extended messages (includes tool result)
   stop_reason: "end_turn"
   Final text: "Le PIB de la Côte d'Ivoire en 2023 était de 70,05 milliards
                USD (source : Banque mondiale, NY.GDP.MKTP.CD)."

9. BACKEND RESPONSE
   HTTP 200
   { reply: "Le PIB...", tool_calls: [{ tool, input, result }] }

10. FRONTEND RENDERING
    ChatBubble: assistant message text
    ToolCallBadge: "get_economic_indicators" pill
    IndicatorCard / TimeSeriesCard:
      - Latest value: 70,1 Mrd USD
      - Year: 2023
      - Trend arrow (% change vs previous year)
      - Sparkline SVG (10 years of data)
```

#### Data transformation pipeline

```
World Bank JSON                  →  Python Pydantic model           →  TypeScript interface
─────────────────────────────────────────────────────────────────────────────────────────
[                                   TimeSeriesData(                    interface TimeSeriesData {
  { "page": 1,                        indicator=IndicatorMeta(           indicator: {
    "pages": 5,                         id="NY.GDP.MKTP.CD",               id: string
    "per_page": 10,                     name="GDP (current US$)",          name: string
    "total": 64,                        country="Côte d'Ivoire"            country: string
    "lastupdated": "2024-01"          ),                                 }
  },                                  data=[                             data: Array<{
  [                                     DataPoint(year="2023",             year: string
    { "date": "2023",                              value=70.05e9),         value: number|null
      "value": 70051234567.0,           DataPoint(year="2022",           }>
      "country": { "id": "CI" } },               value=68.12e9),       }
    ...                               ]
  ]                                 )
]
```

---

## 2. Key Architecture Decisions

### Decision 1: Monorepo vs Multi-Repository

**Choice: Monorepo**

Single developer, 3-day timeline, shared CI/CD pipeline, and a reviewer who needs
to see the full picture in one `git clone`. The overhead of managing two repositories
(separate CI, separate deployments, separate READMEs) would slow down development
without providing meaningful benefit at this scale.

| Factor | Monorepo | Multi-repo |
|---|---|---|
| Developer velocity | Fast — one PR, one CI | Slower — coordinate across repos |
| Reviewer experience | One `git clone` | Two clones, cross-referencing |
| Shared env strategy | One `.env.example` | Duplicated |
| Deploy independence | Coupled | Independent |

**At scale:** Split into separate repositories when frontend and backend teams
deploy on different schedules and independent ownership becomes the priority.

---

### Decision 2: LLM Orchestration in MCP Server, not Frontend

**Choice: LLM calls happen exclusively in the backend**

Placing the Anthropic API call in the frontend would expose the `ANTHROPIC_API_KEY`
in the browser bundle — a critical security risk. All tool definitions, system
prompt, and agentic loop logic live in `llm.py`.

The frontend is a pure display layer: it sends messages and renders structured
responses. It never knows about tool schemas, indicator IDs, or the World Bank API.

---

### Decision 3: World Bank API over FNE / DGI / GUCE

**Choice: World Bank API (api.worldbank.org/v2)**

| API | Status | Reason not chosen |
|---|---|---|
| FNE (emploi.gouv.ci) | Requires NCC (Numéro de Compte Contribuable) | Ivorian business registration required for test env |
| DGI e-impots | No public REST API documented | No publicly accessible endpoint |
| GUCE | No public REST API | Portal-only, no programmatic access |
| World Bank | ✅ Public, no auth | Rich CI data, well-documented, regularly updated |

**Tradeoff:** The World Bank API is not an Ivorian government system directly.
However, it serves official Ivorian government-reported data and is the most
reliable publicly accessible source for this use case.

---

### Decision 4: React 18 + Vite over Next.js

**Choice: React 18 + Vite**

The assessment specifies React. Next.js adds SSR/SSG complexity that provides
no benefit for a single-page chat application — there is no SEO requirement,
no server components, and no static page generation needed. Vite produces a
minimal static build deployable directly to Vercel.

---

### Decision 5: JWT Authentication — App-Level, Stateless

**Choice: JWT Bearer token, no user accounts**

The MCP server calls the Anthropic API which has per-request costs. Without auth,
anyone who discovers the backend URL could send unlimited requests. JWT protects
the endpoint while remaining stateless (no database, no session table).

The token is issued to any `client_id` string — it is an **application-level
guard**, not per-user identity. A future version would tie tokens to registered
users with rate limiting per `sub`.

```
POST /auth/token  { client_id: "frontend-demo" }
→ JWT { sub: "frontend-demo", exp: now+24h }   (HS256, JWT_SECRET env var)
→ stored in localStorage, auto-refreshed on 401
```

---

### Decision 6: Vercel (Frontend) + Render (Backend)

See [deployment decisions](../README.md#deployment-decisions) for the full
rationale. Summary:

| Service | Frontend (Vercel) | Backend (Render) |
|---|---|---|
| Free tier | Unlimited static | 750h/month web service |
| Deploy source | GitHub auto-deploy | render.yaml Blueprint |
| Docker support | Not needed (static) | Native |
| Cold start | None (CDN) | ~30s after 15min idle |
| HTTPS | Auto (Vercel) | Auto (Render) |

---

## 3. Scalability: 100 → 100,000 Users

### At 100 users (current)
- Single Render instance (free tier, cold start acceptable)
- No caching — direct World Bank API calls
- No database — stateless architecture
- Sufficient for demo / MVP

### At 1,000 users
- **Redis caching** for World Bank API responses (data changes yearly → safe to cache 24h, reduces external calls ~90%)
- **Rate limiting** per JWT `sub` (token bucket algorithm, e.g. 20 req/min)
- Upgrade Render to paid tier (no cold starts, guaranteed uptime)

### At 10,000 users
- **Horizontal scaling** — multiple FastAPI instances behind a load balancer
- **PostgreSQL** — store conversation history per authenticated user
- **Background jobs** — pre-fetch popular indicators on a schedule (Celery + Redis)
- **Observability** — Sentry for errors, Prometheus + Grafana for latency metrics

### At 100,000 users
- **Kubernetes** for container orchestration (GKE or EKS)
- **Redis Cluster** for distributed caching
- **Read replicas** for PostgreSQL
- **Message queue** (RabbitMQ / Kafka) for async LLM request handling
- **Model routing** — simple queries → smaller model (Haiku), complex → Sonnet/Opus
- **Multi-region** — West Africa CDN nodes for latency (Nigeria, Senegal, South Africa)

### Estimated monthly cost

| Scale | Anthropic API | Infrastructure | Total |
|---|---|---|---|
| 100 users | ~$5 | Free tier | ~$5 |
| 1,000 users | ~$50 | ~$25 | ~$75 |
| 10,000 users | ~$500 | ~$200 | ~$700 |
| 100,000 users | ~$5,000 | ~$2,000 | ~$7,000 |

At 100k users, routing non-complex queries to a self-hosted Llama 3 / Mistral
reduces LLM costs by 60–70%.

---

## 4. Security Considerations

| Risk | Mitigation |
|---|---|
| `ANTHROPIC_API_KEY` exposure | Never in frontend; injected as Render env var at runtime |
| JWT forgery | `HS256` with `JWT_SECRET` env var (minimum 32 chars recommended) |
| CORS misconfiguration | `ALLOWED_ORIGINS` env var; default `*` only acceptable for public demo |
| World Bank API rate limiting | No auth required; ~500 req/min per IP — add caching before scaling |
| Prompt injection via user input | Claude system prompt scopes responses to World Bank / CI data |
| Dependency vulnerabilities | `pip audit` in CI; `npm audit` in CI |

---

## 5. Component Dependency Map

```
packages/
├── mcp-server/
│   ├── main.py          ← FastAPI app, CORS, route definitions
│   │   ├── auth.py      ← JWT sign/verify (python-jose)
│   │   ├── llm.py       ← Agentic loop, Anthropic client
│   │   │   └── mcp_app.py ← fastmcp instance, tool registry
│   │   └── tools/       ← 5 MCP tools, World Bank HTTP calls
│   └── config.py        ← pydantic-settings, loads .env
│
└── frontend/
    ├── src/
    │   ├── App.tsx       ← root, mounts <Chat />
    │   ├── components/
    │   │   ├── Chat.tsx          ← state, input, message list
    │   │   ├── ChatBubble.tsx    ← per-message renderer
    │   │   ├── EmptyState.tsx    ← suggestion grid (initial view)
    │   │   ├── IndicatorCard.tsx ← structured data cards
    │   │   └── ui/
    │   │       ├── DataCard.tsx      ← base card wrapper
    │   │       ├── LogoCircle.tsx    ← brand avatar (sm/lg)
    │   │       ├── LoadingBubble.tsx ← typing dots animation
    │   │       └── Sparkline.tsx     ← SVG mini-chart
    │   └── lib/
    │       ├── api.ts        ← HTTP client, JWT management
    │       └── formatters.ts ← formatValue(), calcTrend()
    └── public/
```
