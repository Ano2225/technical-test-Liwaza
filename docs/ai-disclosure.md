# AI Usage Disclosure

## Project: Ivoire Data Assistant

---

## AI Tools Used

| Tool          | Purpose                                      |
|---------------|----------------------------------------------|
| Claude (claude.ai) | Architecture planning, code generation, documentation |
| Claude Code   | Step-by-step project implementation          | ChatGpt for brainstorming in order to challenge the requirements pdf

---

## What Was AI-Assisted

### Architecture & Planning
- Initial architecture diagram structure (reviewed and refined manually)
- API selection reasoning (World Bank API chosen after manually verifying
  that FNE, DGI, and GUCE APIs are not publicly accessible without credentials)
- Monorepo structure design

### Code Generation
- FastAPI MCP server boilerplate
- Pydantic model definitions for tool inputs/outputs
- World Bank API integration functions
- React component scaffolding
- Docker and CI/CD configuration

### Documentation
- README structure and content (reviewed and verified for accuracy)
- Architecture decision document (decisions are genuine engineering choices)
- AI strategy document (model comparisons verified against public pricing/benchmarks)

---

## What Was Manually Written and Verified

- All API endpoint URLs tested manually via `curl` before using in code
- World Bank indicator IDs verified against the World Bank API documentation
- Architecture decisions reflect genuine reasoning, not AI-generated filler
- All Pydantic models verified against actual API response structures
- Docker configurations tested locally before committing

---

## Verification Responsibility

All code in this repository has been reviewed for:
- Technical correctness
- Security (no API keys in code, proper JWT validation)
- Accuracy of API calls (tested against real World Bank endpoints)
- Logical consistency of architecture decisions

Any errors or inaccuracies are the sole responsibility of the candidate.

---

## Prompts Used

### CLAUDE.md generation (before starting the project)

This prompt was sent to Claude (claude.ai) to produce the `CLAUDE.md` project
specification file that Claude Code reads at the start of every session.
Writing this file first is what allowed the AI coding assistant to stay
consistent about architecture, tools, naming, and constraints throughout the
entire build.

```
I have to build an AI-native public data assistant for Côte d'Ivoire.
Here is the brief:

- Help citizens, researchers, NGOs, and policymakers explore development indicators
  through natural language
- Use the World Bank API as the data source
- Frontend: React 18 + Vite + TypeScript + Tailwind + shadcn/ui (MCP client)
- Backend: Python 3.11 + FastAPI + fastmcp (MCP server)
- LLM: Claude Sonnet 4.6 via Anthropic API (tool_use agentic loop)
- Auth: JWT Bearer token between frontend and MCP server
- Deploy: Vercel (frontend) + Render (backend)

Generate a CLAUDE.md file I can put at the root of the repo so that Claude Code
understands the full project context from session one. Include:
- Architecture diagram (ASCII)
- The 5 MCP tools required with their World Bank API endpoints and key indicator IDs
- Monorepo folder structure
- Tech stack table
- Build steps checklist
- Coding conventions (commits, error handling, logging, env vars)
```

---

### Architecture planning prompt
```
Help me design the architecture for an AI-native eGov platform for Côte d'Ivoire
using the World Bank API. The platform must use React (MCP client), FastAPI (MCP server),
and Claude Sonnet 4.6 for LLM orchestration. Walk me through the design step by step.
```

### MCP server implementation prompt
```
Build the FastAPI MCP server with 5 tools: get_country_profile, search_indicators,
get_economic_indicators, get_education_indicators, get_health_indicators.
Each tool must use Pydantic for validation, include error handling, and call
the World Bank API at api.worldbank.org/v2.
```

### Frontend UX/UI improvement prompt
```
Improve the UX/UI. The frontend should provide a modern AI experience similar to
contemporary AI products. Features needed: conversational interface, conversation
history, tool execution visibility (expandable badges showing which WB query was made
and with what params), structured data cards (sparkline, trend arrow, latest value),
inline error handling, FR/EN language switcher with icon (default English), help panel
documenting the 5 tools with clickable example questions, copy-to-clipboard on messages,
cycling loading status, new conversation button. Use Inter as the font.
```

### Test rewrite prompt
```
Rewrite the tests so they cover all 5 tool functions × (success path, 404 / invalid input,
network error, empty data, null values). Also add a test that verifies the World Bank
API endpoint is reachable. Do not use any mock data — all tests must call the live
World Bank API. For network-error paths, use monkeypatch to point WB_BASE at an
unreachable host instead of mocking httpx.
```

### Documentation prompt
```
Write the architecture decision document covering: current architecture diagram,
service interactions, deployment topology, data flow, and scalability from
100 to 100,000 users.
```
