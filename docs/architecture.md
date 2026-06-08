# Architecture Decision Document

## Project: Ivoire Data Assistant

---

## 1. Current Architecture

### Architecture Diagram

```
┌────────────────────────────┐
│ User                       │
│ English or French          │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│ React Frontend             │
│ React 18 + Vite            │
│ TypeScript + Tailwind      │
│ shadcn/ui                  │
│                            │
│ - Conversational chat UI   │
│ - Tool execution display   │
│ - Structured data rendering│
└──────────────┬─────────────┘
               │ HTTPS
               │ Authorization: Bearer JWT
               ▼
┌─────────────────────────────────────────────────────┐
│ FastAPI MCP Server                                  │
│ Python 3.11 + fastmcp + Pydantic                    │
│                                                     │
│ - JWT auth validation                               │
│ - Input validation (Pydantic models)                │
│ - LLM orchestration (Claude Sonnet 4.6)  ─────────► Anthropic API
│ - MCP tool registry (5 tools)                       │
│ - Error handling + structured logging               │
└──────────────┬──────────────────────────────────────┘
               │ HTTPS (no auth required)
               ▼
┌────────────────────────────┐
│ World Bank API             │
│ api.worldbank.org/v2       │
│ Public, no authentication  │
└────────────────────────────┘
```

### Service Interactions

1. User types a message in the chat (French or English)
2. Frontend sends the message to the MCP server with a JWT token
3. MCP server validates the token
4. MCP server sends the message to Claude Sonnet 4.6 with the 5 tools defined
5. Claude decides which tool(s) to call based on the user's intent
6. The tool executes a real HTTP request to the World Bank API
7. The result is returned to Claude, which formats a natural language response
8. The MCP server sends the response back to the frontend
9. The frontend renders the response with tool execution visibility

### Deployment Topology

```
Vercel (Frontend)
    └── React SPA served as static files
    └── env: VITE_API_URL → Render backend URL

Render (Backend)
    └── FastAPI server (free tier web service)
    └── env: ANTHROPIC_API_KEY, JWT_SECRET
    └── auto-deploy on push to main
```

### Data Flow

```
User message (text)
    → Frontend (HTTPS POST /chat)
    → MCP Server validates JWT
    → Anthropic API (messages + tools)
    → Claude selects tool
    → World Bank API (HTTPS GET)
    → JSON response
    → Claude formats answer
    → MCP Server returns structured response
    → Frontend renders chat bubble + tool badge
```

---

## 2. Key Architecture Decisions

### Decision 1: Monorepo vs Multi-Repository

**Choice: Monorepo**

**Reasoning:**
Single developer, 3-day timeline, shared CI/CD pipeline, and a reviewer who needs
to see the full picture in one `git clone`. The overhead of managing two repositories
(separate CI, separate deployments, separate READMEs) would slow down development
without providing meaningful benefit at this scale.

**Advantages:**
- One repository, one PR, one CI pipeline
- Shared environment variable strategy
- Easier for the reviewer to inspect the full codebase
- Atomic commits across frontend and backend

**Disadvantages:**
- Tighter coupling between services
- As teams grow, a monorepo becomes harder to manage
- Build times increase as the codebase grows

**At scale:** Split into separate repositories when frontend and backend teams
are independent and deploy on different schedules.

---

### Decision 2: LLM Orchestration in MCP Server, not Frontend

**Choice: LLM calls happen in the backend (MCP Server)**

**Reasoning:**
The assessment states "business logic should live inside the MCP server" and
"the frontend should not bypass the MCP layer." Placing the Anthropic API call
in the frontend would expose the API key in the browser — a critical security risk.

**Advantages:**
- API key never exposed to the client
- Centralized control over prompts and tool definitions
- Easier to add rate limiting, caching, and logging

---

### Decision 3: World Bank API over FNE / DGI / GUCE

**Choice: World Bank API**

**Reasoning:**
FNE requires a valid NCC (Numéro de Compte Contribuable) — a Ivorian business
tax registration number — to access the test environment. DGI e-impots and GUCE
have no publicly documented REST API. The World Bank API is fully public, requires
no authentication, is well-documented, and contains rich Côte d'Ivoire development
data updated regularly.

**Tradeoff:** The World Bank API is not an Ivorian government system. However,
it serves official Ivorian government data as reported to international institutions
and is the most reliable publicly accessible source for this use case.

---

### Decision 4: React 18 + Vite over Next.js

**Choice: React 18 + Vite**

**Reasoning:**
The assessment specifies React. Next.js adds SSR/SSG complexity that provides
no benefit for a single-page chat application. Vite provides a fast dev server,
simple config, and produces optimized static output deployable to Vercel.

---

### Decision 5: JWT Authentication between Frontend and MCP Server

**Choice: JWT Bearer token**

**Reasoning:**
The MCP server calls the Anthropic API, which has usage costs. Without auth,
anyone who discovers the backend URL could send unlimited requests. JWT protects
the backend while remaining stateless and simple to implement.

---

## 3. Scalability: 100 → 100,000 Users

### At 100 users (current architecture)
- Single Render instance (free tier)
- No caching — direct World Bank API calls
- No database — stateless
- Sufficient for demo / MVP

### At 1,000 users
- **Add Redis caching** for World Bank API responses
  - World Bank data changes yearly — safe to cache for 24h
  - Reduces external API calls by ~90%
- **Add rate limiting** per user (token bucket algorithm)
- Upgrade Render to paid tier for consistent uptime

### At 10,000 users
- **Horizontal scaling** — multiple FastAPI instances behind a load balancer
- **Database (PostgreSQL)** — store conversation history per user
- **CDN** for frontend (Vercel handles this automatically)
- **Background jobs** — pre-fetch and cache popular indicators on a schedule
- **Observability** — add Sentry for error tracking, Prometheus + Grafana for metrics

### At 100,000 users
- **Kubernetes** for container orchestration
- **Redis Cluster** for distributed caching
- **Read replicas** for PostgreSQL
- **Message queue (RabbitMQ/Kafka)** for async LLM requests
- **Self-hosted LLM** (Llama / Mistral) for high-volume, cost-sensitive requests
- **Multi-region deployment** for latency (West Africa CDN nodes)
- **Cost considerations:** At 100k users, Anthropic API costs become significant.
  Implement request routing: simple queries → smaller/cheaper model,
  complex analysis → Claude Sonnet/Opus.

### Estimated cost at scale

| Scale      | Anthropic API est. | Infrastructure est. |
|------------|--------------------|---------------------|
| 100 users  | ~$5/month          | Free tier           |
| 1,000 users| ~$50/month         | ~$25/month          |
| 10,000 users| ~$500/month       | ~$200/month         |
| 100,000 users| ~$5,000/month    | ~$2,000/month       |

At 100k users, self-hosting Llama 3 or Mistral for non-sensitive queries
reduces LLM costs by 60-70%.
