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
- "Quel est le PIB de la Côte d'Ivoire en 2022 ?"
- "Show me primary school enrollment trends"
- "Compare life expectancy over the last 10 years"
- "What is the inflation rate in Côte d'Ivoire?"

---

## Architecture

```
React Frontend (MCP Client)
        │
        │ HTTPS + JWT
        ▼
FastAPI MCP Server ──► Anthropic API (Claude Sonnet 4.6)
        │
        │ HTTPS (no auth)
        ▼
World Bank API (api.worldbank.org/v2)
```

See [docs/architecture.md](docs/architecture.md) for the full architecture decision document.

---

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind + shadcn/ui |
| Backend  | Python 3.11 + FastAPI + fastmcp                     |
| LLM      | Claude Sonnet 4.6 (tool_use)                        |
| Deploy   | Vercel (frontend) + Render (backend)                |

---

## Project Structure

```
ivoire-data-assistant/
├── packages/
│   ├── mcp-server/     # Python FastAPI MCP backend
│   └── frontend/       # React 18 + Vite frontend
├── docs/
│   ├── architecture.md
│   ├── ai-strategy.md
│   └── ai-disclosure.md
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (optional)

### Backend

```bash
cd packages/mcp-server
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in ANTHROPIC_API_KEY and JWT_SECRET
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd packages/frontend
npm install
cp .env.example .env            # fill in VITE_API_URL
npm run dev
```

### Docker (full stack)

```bash
docker-compose up --build
```

Frontend: http://localhost:3000
Backend:  http://localhost:8000
API docs: http://localhost:8000/docs

---

## Environment Variables

### Backend (`packages/mcp-server/.env`)
```
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=your-secret-key
WORLDBANK_BASE_URL=https://api.worldbank.org/v2
COUNTRY_CODE=CI
```

### Frontend (`packages/frontend/.env`)
```
VITE_API_URL=http://localhost:8000
```

---

## Deployment

- **Frontend:** Vercel — connect GitHub repo, set `VITE_API_URL` env var
- **Backend:** Render — connect GitHub repo, set env vars, free tier web service

See [docs/architecture.md](docs/architecture.md) for full deployment decisions.

---

## MCP Tools

| Tool                       | Description                              |
|----------------------------|------------------------------------------|
| `get_country_profile`      | Côte d'Ivoire country overview           |
| `search_indicators`        | Search World Bank indicators by keyword  |
| `get_economic_indicators`  | GDP, inflation, trade data               |
| `get_education_indicators` | Enrollment, literacy rates               |
| `get_health_indicators`    | Mortality, life expectancy, disease data |

---

## Testing

```bash
cd packages/mcp-server
pytest tests/ -v
```

---

## Assumptions & Tradeoffs

- **World Bank API** was chosen over FNE/DGI/GUCE because it is accessible without business registration.
- **Monorepo** was chosen for simplicity given a single developer and 3-day timeline.
- **JWT auth** between frontend and MCP server protects the Anthropic API key from exposure.
- **Claude Sonnet 4.6** was chosen over Opus for cost/latency balance in a public-facing app.

---

## Future Improvements

- Add more country comparisons (regional West Africa benchmarks)
- Add data visualization charts (recharts)
- Add caching layer (Redis) for World Bank responses
- Support more World Bank indicators
- Add user accounts and saved queries
- PWA support for mobile users in low-connectivity areas

---

## AI Usage Disclosure

See [docs/ai-disclosure.md](docs/ai-disclosure.md).

---

## AI Strategy

See [docs/ai-strategy.md](docs/ai-strategy.md).
