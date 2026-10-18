# System Architecture: BookLeaf Author Support Portal

## 1. High-Level Architecture Overview
The system is architected as a decoupled full-stack monorepo featuring a FastAPI Python backend and a React + TypeScript Vite frontend, backed by PostgreSQL.

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (React + TS + Vite)        │
│  - Author Portal (Dashboard, Books, Royalties, Tickets)│
│  - Admin Workbench (Queue, AI Draft Editor, Notes)     │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (JWT Auth)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                    │
│  - RBAC Middleware (author vs admin)                   │
│  - Database Access (SQLAlchemy 2.0 ORM + Alembic)      │
│  - AI Service Engine (Gemini SDK + Deterministic Rules)│
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
   ┌────────────────────┐       ┌──────────────────────┐
   │ PostgreSQL 16/18   │       │ Google Gen AI Gemini │
   │ (Supabase/Docker)  │       │ (or Offline Fallback)│
   └────────────────────┘       └──────────────────────┘
```

## 2. Domain Data Models
- **`User`**: Authentication identities, hashed passwords (Argon2id), roles (`author` | `admin`).
- **`Author`**: Author profiles (`AUTH001` - `AUTH010`), linked to `User`.
- **`Book`**: Titles (`BK001` - `BK018`), ISBNs, publication status, MRP, royalties, distribution platform list.
- **`Ticket`**: Support requests with sequential references (`TKT-2026-XXXX`), category, priority, status.
- **`TicketMessage`**: Published communication threads between authors and operations admins.
- **`InternalNote`**: Private administrative notes strictly isolated from author access.
- **`TicketAuditEvent`**: Audit trail recording state changes and actions.
- **`RefreshToken`**: Session management and rotation tokens.

## 3. Real-Time Communication Strategy
To provide near-real-time updates without the connection state overhead of long-lived WebSockets in serverless environments, the author ticket view uses reactive short-interval polling (4 seconds) via `@tanstack/react-query`. When an admin publishes a response, the author's screen updates automatically without requiring a full page reload.
