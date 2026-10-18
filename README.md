# BookLeaf Author Support & Communication Portal

A full-stack, AI-powered communication and operations platform built for BookLeaf Publishing. Features dedicated author dashboards, catalog transparency, royalty accounting, ticket lifecycle management, and operations workbenches with context-grounded AI response drafting.

---

## 1. Project Overview & Features

### Author Portal
- **Secure Authentication**: Email & password login, JWT session management, strict author data isolation.
- **Author Dashboard**: Real-time KPI summary cards (Total Titles, Published Titles, In-Production Titles, Copies Sold, Royalties Earned, Disbursed, and Pending).
- **My Books Catalog**: Searchable and filterable catalog (Title, ISBN, Genre, Status, MRP, Sold Copies, Royalties, Distribution platforms). Gracefully handles edge cases (books in production with null publication dates or zero royalties).
- **My Royalties**: Transparent 80/20 net-profit policy breakdown, quarterly payout schedule, ₹1,000 threshold tracker, and per-title statements.
- **Submit Support Query**: Form with related title selector (or General / Account Level), subject, description, and optional file attachment UI.
- **My Tickets & Real-Time Thread**: Live ticket tracking with automatic short-interval updates (4s polling). Shows official responses without exposing private internal admin notes.

### Admin Operations Portal
- **Operations Dashboard**: Metrics for Total, Open, In-Progress, Resolved, Closed, Critical/High Priority, and Unassigned tickets, plus calculated average response times and category volume charts via Recharts.
- **Intelligent Ticket Queue**: Multi-parameter filters (status, category, priority, assigned admin, search) with smart urgency sorting (Critical & oldest unresolved surfaced first).
- **Ticket Management Workbench**:
  - Author and verified book database context cards.
  - Ticket self-assignment and status workflow updates.
  - Category and priority overrides with audit logging.
  - **Private Internal Notes**: Encrypted, strictly segregated notes for operations coordination.
  - **AI-Drafted Responses**: Generates empathetic, policy-grounded draft replies using the official BookLeaf Knowledge Base and verified database facts.
  - **Human-in-the-Loop Publishing**: Responses are editable and require explicit administrator approval before sending to authors.

---

## 2. Technology Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL, Argon2id, Python-Jose (JWT), Google Gen AI SDK (`google-genai`).
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, TanStack Query, Recharts, React Hook Form, Zod.
- **Testing**: Pytest (Backend API, RBAC, Seeding, Lifecycle), Vitest + React Testing Library (Frontend UI & Badges).
- **Containerization**: Docker & Docker Compose.

---

## 3. Demo Credentials

The database includes pre-bootstrapped demo accounts for all 10 authors and operations administration:

| Role | Name / Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bookleaf.com` | `AdminSecure@2026` | Operations Administrator Workbench |
| **Author** | `priya.sharma@email.com` | `AuthorDemo@2026` | Priya Sharma (`AUTH001`) — 2 Published Titles |
| **Author** | `sneha.kulkarni@email.com` | `AuthorDemo@2026` | Sneha Kulkarni (`AUTH007`) — Has book in production |
| **Author** | `rohit.kapoor@email.com` | `AuthorDemo@2026` | Rohit Kapoor (`AUTH002`) — Multi-channel distribution |
| **Author** | `ananya.reddy@email.com` | `AuthorDemo@2026` | Ananya Reddy (`AUTH003`) — Unpaid pending royalties |
| **Author** | `farhan.sheikh@email.com` | `AuthorDemo@2026` | Farhan Sheikh (`AUTH008`) — Single title |
| **Author** | *(All other authors from dataset)* | `AuthorDemo@2026` | `AUTH004` through `AUTH010` |

*Note: The login page supports flexible authentication. Users can enter any of the 10 author emails, Author IDs (`AUTH001` through `AUTH010`), full names, or admin credentials directly.*

---

## 4. Local Setup Instructions

### Prerequisites
- Python 3.10+ (Verified with Python 3.10.11)
- Node.js v18+ or v20+ (Verified with v24.20) & npm
- PostgreSQL 14+ running locally on port 5432 (or Docker)

### Option A: Local Development (Windows PowerShell)

```powershell
# 1. Clone repository and navigate to root
cd bookleaf-portal

# 2. Setup Backend Virtual Environment
py -3.10 -m venv backend/venv
.\backend\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

# 3. Create PostgreSQL Database
$env:PGPASSWORD='postgres'
psql -U postgres -h localhost -c "CREATE DATABASE bookleaf_db;"

# 4. Run Migrations, Dataset Seeding & Demo Bootstrapping
cd backend
.\venv\Scripts\alembic stamp head
cd ..
.\backend\venv\Scripts\python scripts/seed_database.py
.\backend\venv\Scripts\python scripts/bootstrap_demo_accounts.py

# 5. Start Backend Server (runs on http://127.0.0.1:8001)
cd backend
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8001

# 6. In a new terminal, Start Frontend (runs on http://127.0.0.1:5173 or 5175)
cd frontend
npm install
npm run dev
```

### Option B: Local Development (Unix / macOS / Linux)

```bash
# 1. Setup Backend
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt

# 2. Database & Seeding
createdb bookleaf_db || true
python scripts/seed_database.py
python scripts/bootstrap_demo_accounts.py

# 3. Run Backend
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8001

# 4. In another terminal, run Frontend
cd frontend
npm install
npm run dev
```

### Option C: Docker Compose

```bash
# Start Postgres, Backend, and Frontend Nginx in containers
docker-compose up --build -d

# Execute seeding in backend container
docker-compose exec backend python ../scripts/seed_database.py
docker-compose exec backend python ../scripts/bootstrap_demo_accounts.py
```
Frontend will be accessible at `http://localhost:3000` and Backend at `http://localhost:8000`.

---

## 5. Running Automated Tests

### Backend Unit & Integration Tests (Pytest)
```powershell
cd backend
.\venv\Scripts\pytest -v
```
*Tests verify JWT authentication, author isolation, internal notes confidentiality, dataset counts (10 authors, 18 books), and the complete ticket lifecycle.*

### Frontend Unit & Component Tests (Vitest)
```powershell
cd frontend
npm test
```
*Tests verify badges rendering, login form behaviors, and credential autofill.*

### Frontend Production Build & Type Checking
```powershell
cd frontend
npm run build
```

### Automated End-to-End Browser QA Suite (Playwright)
```powershell
node scripts/run_browser_qa.cjs
```
*Executes 54 automated browser test cases verifying Authentication & Authorization, Author Portal, Admin Operations Workbench, Gemini AI Integration, and Responsive Layouts across desktop, tablet, and mobile viewports. See [docs/BROWSER_QA_REPORT.md](docs/BROWSER_QA_REPORT.md) and screenshot artifacts in `docs/qa_artifacts/screenshots/`.*

### Live End-to-End API Integration Verification
```powershell
.\backend\venv\Scripts\python scripts/verify_live_e2e.py
```

---

## 6. AI Integration & Knowledge Base Configuration

- **Provider**: Google Gen AI SDK (`google-genai`).
- **Configurable Model**: Defaults to `gemini-2.5-flash` (or `gemini-1.5-flash`).
- **Environment Variable**: Set `GEMINI_API_KEY` in `.env`.
- **Offline / Fallback Resilience**: If no API key is provided, or if the service encounters rate limits or network errors, the system automatically engages the deterministic fallback engine (`DeterministicFallbackAIService`). Ticket creation and response publishing are never blocked.
- **Knowledge Base Policies Grounded**:
  - **80/20 Royalty Policy**: Net profit calculation, quarterly disbursement, 45-day window, ₹1,000 threshold.
  - **ISBN Policy**: Imprint assignments, 48-hour production escalation for mismatches.
  - **Printing & Quality Guarantee**: 5–7 business days turnaround, free reprints for verified defects.
  - **Distribution**: 7–10 days for new listings, 24–48 hours stock re-sync.
  - **Communication Tone**: Empathetic, partner mindset, verified facts only, clear timelines.

---

## 7. Cloud Deployment Guide

### A. Database: Supabase / Neon / Render PostgreSQL
1. Create a PostgreSQL project on Supabase or Render.
2. Copy the connection string (e.g. `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`).
3. Set `DATABASE_URL` in the backend environment.

### B. Backend: Render Web Service
1. Create a new Web Service on Render pointing to your repository.
2. Root Directory: `backend`
3. Environment: `Python 3`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variables:
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`
   - `ENVIRONMENT=production`
   - `GEMINI_API_KEY` (optional)
   - `BACKEND_CORS_ORIGINS=["https://your-frontend.vercel.app"]`

### C. Frontend: Vercel Static Deployment
1. Import repository into Vercel.
2. Root Directory: `frontend`
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL=https://your-backend.onrender.com/api/v1`

---

## 8. Requirements Traceability Checklist

- [x] 10 Authors & 18 Books imported from sample JSON without omission or fabrication.
- [x] Edge cases preserved: In-production books (null publication dates/MRPs), zero sales, zero royalties, and multi-channel platforms.
- [x] Author authentication & session persistence.
- [x] Strict author data isolation (authors only access their own data).
- [x] Author dashboard, catalog view, and 80/20 royalty statement.
- [x] Support query submission with related book selector and validation.
- [x] Near-real-time ticket updates (4s reactive polling).
- [x] Admin operations dashboard with calculated response metrics & volume charts.
- [x] Filterable admin queue with smart urgency sorting.
- [x] AI auto-classification into the 6 exact assignment categories.
- [x] AI priority scoring with administrative manual overrides.
- [x] Grounded AI response drafts citing BookLeaf Knowledge Base and verified database facts.
- [x] Deterministic fallback when AI provider is offline or rate-limited.
- [x] Strict confidentiality of internal admin notes (never leaked to authors).
- [x] 1-page executive approach write-up (`docs/approach-writeup.md`).
