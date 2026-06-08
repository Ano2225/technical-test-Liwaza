# AI & LLM Strategy

## Project: Ivoire Data Assistant

---

## Current Choice: Claude Sonnet 4.6

For this product, the LLM sits inside the MCP server and is responsible for:
1. Understanding the user's intent (French or English)
2. Selecting the right MCP tool to call
3. Formatting the World Bank data into a readable, contextual response

Claude Sonnet 4.6 was selected for the following reasons:
- Native tool_use support with high reliability
- Strong bilingual performance (French + English)
- Good cost/quality balance for a public-facing app
- Low latency compared to Opus models

---

## Model Comparison for This Product

### GPT-4.1 (OpenAI)
- **Quality:** Excellent for tool use and structured outputs
- **Cost:** ~$2/M input tokens — moderate
- **Latency:** ~1-2s average
- **Privacy:** Data processed by OpenAI — GDPR compliance requires a DPA agreement
- **Verdict for this product:** Strong alternative. Good bilingual support.
  However, Claude's tool_use is more reliable for structured MCP workflows.

### GPT-4o (OpenAI)
- **Quality:** Slightly below GPT-4.1, faster
- **Cost:** ~$2.5/M input tokens
- **Latency:** ~0.8s — faster than GPT-4.1
- **Privacy:** Same OpenAI GDPR concerns
- **Verdict:** Good for high-volume, cost-sensitive deployments.
  Less reliable tool selection than Claude.

### Claude Sonnet 4.6 (Anthropic) ✅ SELECTED
- **Quality:** Excellent tool_use, strong reasoning, bilingual FR/EN
- **Cost:** ~$3/M input tokens
- **Latency:** ~1s average
- **Privacy:** Anthropic processes data — GDPR DPA available
- **Verdict:** Best fit for this product. Native MCP support, reliable tool selection,
  and strong French language capability for Ivorian users.

### Claude Opus 4.6 (Anthropic)
- **Quality:** Best-in-class reasoning and analysis
- **Cost:** ~$15/M input tokens — 5x more expensive than Sonnet
- **Latency:** ~3-5s — noticeably slower
- **Privacy:** Same as Sonnet
- **Verdict:** Overkill for this use case. Reserved for complex multi-step
  analysis tasks where quality is critical. Not justified for simple indicator queries.

### Gemini 2.5 (Google)
- **Quality:** Strong multimodal capabilities, good for data interpretation
- **Cost:** Competitive pricing, free tier available
- **Latency:** ~1s
- **Privacy:** Google processes data — GDPR concerns for EU/African data governance
- **Verdict:** Viable alternative. Particularly interesting for future data
  visualization features. Less mature tool_use ecosystem than Claude.

### Llama 3 (Meta, open source)
- **Quality:** Good for instruction-following, weaker on complex reasoning
- **Cost:** Free if self-hosted; compute costs only
- **Latency:** Depends on infrastructure — can be <1s on GPU
- **Privacy:** Full control — data never leaves your infrastructure ✅
- **Self-hosting:** Possible on AWS/GCP GPU instances
- **Verdict:** Best option for privacy-sensitive queries at scale.
  At 100k users, routing simple queries to a self-hosted Llama instance
  reduces costs by 60-70%. Recommended for future cost optimization.

### Mistral (Mistral AI)
- **Quality:** Strong for European languages; weaker on African contexts
- **Cost:** Very competitive — cheaper than GPT/Claude
- **Latency:** Fast (~0.5s)
- **Privacy:** EU-based — strong GDPR compliance ✅
- **Self-hosting:** Available via Mistral API or self-hosted
- **Verdict:** Good fallback for cost reduction. French language performance
  is strong (French company). Worth evaluating for the FR language path.

---

## GDPR & Compliance Considerations

This product handles queries about public development data — no PII by default.
However, as users may include personal context in queries:

- **Data residency:** World Bank data is public. User messages are processed
  by the LLM provider (Anthropic by default).
- **GDPR:** Anthropic offers a Data Processing Agreement (DPA).
  Required if serving EU-based users.
- **African data governance:** ECOWAS has emerging data protection frameworks.
  Côte d'Ivoire has the ARTCI as the data protection authority.
- **Recommendation:** Store no user messages by default. Add opt-in conversation
  history with explicit consent and data deletion capability.

---

## Recommended Model Routing Strategy at Scale

```
User query
    │
    ├── Simple factual query ("What is CI GDP?")
    │       └── Llama 3 (self-hosted) or Mistral → low cost
    │
    ├── Complex analysis ("Compare CI education vs regional average")
    │       └── Claude Sonnet 4.6 → best tool_use + reasoning
    │
    └── Deep research / report generation
            └── Claude Opus 4.6 → maximum quality, used sparingly
```

This routing strategy reduces LLM costs by ~50% at scale while maintaining
quality where it matters most.

---

## Future AI Features

- **Data summarization:** Auto-generate narrative summaries of indicator trends
- **Anomaly detection:** Flag unusual spikes in economic/health data
- **Comparison mode:** Compare Côte d'Ivoire with regional peers (Ghana, Senegal)
- **Report generation:** Export AI-generated briefings as PDF
- **Voice interface:** Speech-to-text for low-literacy users in rural areas
