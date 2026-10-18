# BookLeaf Author Support Portal: Architectural Approach & Decisions

**Author**: Senior Full-Stack Engineer  
**Role**: Technical Assessment Submission

---

### 1. Priorities
When approaching this assignment, I prioritized three core pillars:
1. **Absolute Correctness & Data Fidelity**: Preserving all 10 authors, 18 titles, edge cases (books in production with null publication dates/MRPs, zero-royalty states, and international platform arrays), and ensuring idempotent database initialization.
2. **Security & Strict Author Isolation**: Ensuring authors can never view another author’s catalog or support tickets, while strictly sequestering internal admin notes from author-facing serializers.
3. **Robust AI Reliability with Human Oversight**: Building an AI support assistant grounded in verified database facts and the official BookLeaf Knowledge Base, with deterministic offline fallbacks so operations are never blocked if the LLM provider experiences downtime or rate limits.

---

### 2. Architectural Decisions & Trade-Offs

- **FastAPI + SQLAlchemy 2.0 vs. Full-Stack Next.js**:
  I chose a dedicated FastAPI Python service paired with a Vite + React SPA monorepo. This provides native integration with the official Google Gen AI Python SDK, strict Pydantic validation, Alembic migrations, and decoupled static frontend deployment to Vercel with a Render/Docker backend.
  
- **Short-Interval Reactive Polling vs. WebSockets**:
  Instead of managing stateful WebSocket server connections across multiple cloud instances, I implemented reactive 4-second short-interval polling via TanStack Query. This satisfies the requirement that authors see replies without refreshing the page, while maintaining stateless, horizontally scalable REST endpoints.

- **Argon2id Password Hashing & JWT Refresh Rotation**:
  Authentication separates user login credentials from author profile records. Refresh tokens are stored in the database with revocation capabilities to prevent token replay attacks.

- **Selective Knowledge Base Retrieval vs. Full Prompt Stuffing**:
  Instead of passing the entire Knowledge Base and infinite history on every LLM call, our service extracts only the relevant policy card (Royalty, ISBN, Printing, Distribution, or Production) based on category detection, reducing token overhead to <800 tokens per call.

---

### 3. How This System Would Evolve at Scale

1. **Vector-Augmented RAG**: As the knowledge base grows to encompass hundreds of FAQs, contracts, and distributor specifications, transition from keyword-matched retrieval to semantic vector embeddings (e.g. pgvector in PostgreSQL) with hybrid BM25 search.
2. **Asynchronous Background Processing (Celery / Redis)**: Offload heavy AI classification and email notifications to background worker queues, ensuring API response times remain under 50ms under heavy volume.
3. **Automated Document & Photo Verification**: Implement vision models to automatically inspect photos of reported print defects (misprints, damaged bindings) to expedite reprint approvals.
4. **Author Self-Service Knowledge Suggestions**: Surface suggested knowledge base articles directly within the ticket submission form as the author types their subject line, deflecting routine inquiries before submission.
