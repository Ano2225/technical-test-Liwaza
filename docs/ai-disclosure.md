# AI Usage Disclosure

## Project: Ivoire Data Assistant

---

## AI Tools Used

| Tool          | Purpose                                      |
|---------------|----------------------------------------------|
| Claude (claude.ai) | Architecture planning, code generation, documentation |
| Claude Code   | Step-by-step project implementation          |

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
- JWT authentication logic reviewed line by line
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

### Frontend

### Documentation prompt
```
Write the architecture decision document covering: current architecture diagram,
service interactions, deployment topology, data flow, and scalability from
100 to 100,000 users.
```
