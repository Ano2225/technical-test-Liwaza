# Ivoire Data Assistant — CLAUDE.md

## Project Context

AI-native public data assistant for Côte d'Ivoire.
Helps citizens, researchers, NGOs, and policymakers explore Côte d'Ivoire
development indicators through natural language — powered by the World Bank API.

---

## Architecture

```
┌────────────────────────────┐
│ User                       │
│ - Asks questions in chat   │
│ - English or French        │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│ React Frontend             │
│ MCP Client                 │
│ React 18 + Vite +          │
│ TypeScript + Tailwind +    │
│ shadcn/ui                  │
│                            │
│ - Chat interface           │
│ - Conversation history     │
│ - Tool execution display   │
│ - Structured data rendering│
│ - Send authenticated calls │
└──────────────┬─────────────┘
               │ HTTPS
               │ Authorization: Bearer token
               ▼
┌─────────────────────────────────────────────────────┐
│ FastAPI MCP Server                                  │
│ Python 3.11 + Pydantic                              │
│                                                     │
│ - Authentication / Authorization                    │
│ - Input validation (Pydantic)                       │
│ - MCP tool registry (5 tools)                       │
│ - Business logic                                    │
│ - LLM orchestration ──────────────────────────────► Anthropic API
│ - Error handling                                    │  Claude Sonnet 4.6
│ - Logging                                           │  (tool_use)
│ - API documentation                                 │
└──────────────┬──────────────────────────────────────┘
               │ HTTPS — no auth required
               ▼
┌────────────────────────────┐
│ World Bank API             │
│ api.worldbank.org/v2       │
│                            │
│ - Country profile          │
│ - Economic indicators      │
│ - Education indicators     │
│ - Health indicators        │
│ - Indicator search         │
└────────────────────────────┘
```

## Core Rule

The frontend never contacts the World Bank API directly.
All business logic and LLM orchestration live in the MCP server.

---

## Tech Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Frontend  | React 18 + Vite + TypeScript + Tailwind + shadcn/ui |
| Backend   | Python 3.11 + FastAPI + fastmcp                     |
| LLM       | Claude Sonnet 4.6 via Anthropic API (tool_use)      |
| Auth      | JWT Bearer token (frontend ↔ MCP server)            |
| Deploy    | Vercel (frontend) + Render (backend)                |

---

## MCP Tools (5 required)

| Tool                       | Description                                   | WB Endpoint                |
|----------------------------|-----------------------------------------------|----------------------------|
| `get_country_profile`      | General info on Côte d'Ivoire                 | /country/CI                |
| `search_indicators`        | Search available indicators by keyword        | /indicator                 |
| `get_economic_indicators`  | GDP, inflation, trade, budget data            | /country/CI/indicator/{id} |
| `get_education_indicators` | Enrollment, literacy, school infrastructure   | /country/CI/indicator/{id} |
| `get_health_indicators`    | Mortality, life expectancy, disease data      | /country/CI/indicator/{id} |

### Key Indicator IDs

**Economic:**
- `NY.GDP.MKTP.CD` — GDP (current USD)
- `NY.GDP.PCAP.CD` — GDP per capita
- `FP.CPI.TOTL.ZG` — Inflation rate
- `NE.EXP.GNFS.ZS` — Exports % of GDP

**Education:**
- `SE.PRM.ENRR` — Primary school enrollment
- `SE.SEC.ENRR` — Secondary school enrollment
- `SE.ADT.LITR.ZS` — Adult literacy rate

**Health:**
- `SH.DYN.MORT` — Child mortality rate
- `SP.DYN.LE00.IN` — Life expectancy
- `SH.HIV.INCD.ZS` — HIV incidence rate

---

## World Bank API Reference

- **Base URL:** `https://api.worldbank.org/v2`
- **Auth:** None required ✅
- **Format:** `?format=json`
- **Pagination:** `?per_page=10&page=1`
- **Country code:** `CI` (Côte d'Ivoire)

**Example calls:**
```
GET /v2/country/CI?format=json
GET /v2/indicator?format=json&q=education&per_page=10
GET /v2/country/CI/indicator/NY.GDP.MKTP.CD?format=json&per_page=10
```

---

## Monorepo Structure

```
ivoire-data-assistant/
├── CLAUDE.md
├── README.md
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── architecture.md
│   ├── ai-strategy.md
│   └── ai-disclosure.md
└── packages/
    ├── mcp-server/
    │   ├── main.py
    │   ├── auth.py
    │   ├── llm.py
    │   ├── tools/
    │   │   ├── __init__.py
    │   │   ├── country_profile.py
    │   │   ├── search_indicators.py
    │   │   ├── economic_indicators.py
    │   │   ├── education_indicators.py
    │   │   └── health_indicators.py
    │   ├── tests/
    │   │   ├── __init__.py
    │   │   └── test_tools.py
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── .env.example
    └── frontend/
        ├── src/
        │   ├── components/
        │   │   ├── Chat.tsx
        │   │   ├── ChatBubble.tsx
        │   │   ├── ToolCallBadge.tsx
        │   │   └── IndicatorCard.tsx
        │   ├── lib/
        │   │   └── api.ts
        │   ├── App.tsx
        │   └── main.tsx
        ├── Dockerfile
        ├── vite.config.ts
        ├── package.json
        └── .env.example
```

---

## Build Steps

- [x] Architecture + CLAUDE.md
- [ ] MCP Server — structure + 5 tools
- [ ] Unit tests
- [ ] Frontend — design system + components
- [ ] LLM integration (tool_use)
- [ ] Docker + CI/CD
- [ ] Deployment
- [ ] Final documentation

---

## Conventions

- **Commits:** conventional commits (`feat:`, `fix:`, `docs:`, `test:`)
- **Code language:** English
- **UI language:** French by default, English supported
- **Env vars:** never committed, always in `.env.example`
- **Error handling:** every tool returns structured errors (400, 401, 500)
- **Logging:** every tool call logged with timestamp and input summary
