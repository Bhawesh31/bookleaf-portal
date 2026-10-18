# AI Integration Strategy & Architecture: BookLeaf Portal

## 1. Model Selection & Justification
We integrated Google's **Gemini 2.5 Flash** (via the official `google-genai` Python SDK).
- **Cost Efficiency**: High throughput and cost-effective token pricing compared to larger frontier models.
- **Speed & Latency**: Sub-second to 2-second response generation, crucial for operational dashboards.
- **Native JSON Schema Enforcement**: Strict output formatting matching Pydantic schemas without hallucinations.

## 2. Knowledge Base Grounding & Tone Alignment
The AI response generator incorporates the official BookLeaf Knowledge Base guidelines:
- **Tone Guidelines**: Empathetic, partner-first mindset, acknowledge distress first, own errors without corporate deflection, realistic timelines (e.g. 48 hours for ISBN or distribution issues, 5–7 days for reprints).
- **Verified Facts Grounding**: The prompt injects verified database context (author's actual copies sold, total royalties earned, pending balances, last payout dates, and exact book production stages). The system prompt strictly prohibits inventing dates, figures, or unverified actions.

## 3. Cost-Conscious Selective Retrieval
Rather than naively sending the entire knowledge base and infinite chat histories on every API call:
1. The retriever analyzes the ticket's category and keywords to inject only the relevant 1-2 policy sections (e.g. Royalty Policy for payment questions; ISBN policy for imprint collisions).
2. Input prompts are kept under 800 tokens.

## 4. Graceful Degradation & Deterministic Fallback
If the Gemini API key is unconfigured, rate-limited, or network connectivity fails:
- The system immediately transitions to `DeterministicFallbackAIService`.
- The deterministic classifier uses rule-based keyword & intent heuristics (e.g. "6 months" or "missing payment" triggers `Royalty & Payments` with `Critical` priority).
- Fallback draft generation constructs an empathetic, policy-grounded draft incorporating verified database facts.
- **Ticket submission and manual admin responses are never blocked by an AI outage.**

## 5. Human-in-the-Loop Publishing
AI-generated drafts are **never sent automatically**. They are presented to the administrator in an editable workbench. The administrator reviews, fine-tunes, and explicitly clicks **"Publish Response to Author"** before any communication reaches the author.
