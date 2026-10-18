# Security Architecture & Policies: BookLeaf Portal

## 1. Password Hashing & Credentials
- All user passwords are encrypted using **Argon2id** (`passlib[argon2]`), a modern, memory-hard hashing algorithm resistant to GPU brute-force attacks.
- Plaintext passwords are never saved, printed, or returned in API responses.

## 2. Authentication & Session Strategy
- **Access Tokens**: Short-to-medium lived signed JWTs (`HS256`) containing minimal claims (`sub`, `role`, `exp`, `iat`).
- **Refresh Tokens**: Opaque session identifiers stored securely in database with rotation and revocation capabilities.
- Role-based dependencies (`require_author`, `require_admin`) enforce authorization at the endpoint level before business logic executes.

## 3. Strict Author Data Isolation
- All author endpoints filter records strictly by the authenticated author's database ID (`author_id == current_user.author.id`).
- An author querying `/api/v1/tickets/{id}` for another author's ticket receives an immediate `403 Forbidden`.

## 4. Internal Notes Secrecy
- `InternalNote` models are only queryable via `/api/v1/admin/*` endpoints protected by `require_admin`.
- Author serializers (`TicketOutAuthor`) do not have an `internal_notes` field in their schema, ensuring internal notes are never sent over the wire to author clients.

## 5. AI Safety & Prompt Injection Defense
- Ticket text is treated as untrusted user input and placed in isolated content blocks.
- System instructions strictly mandate structured JSON outputs and allowed enum categories.
- Gemini API keys are read strictly from backend environment variables and are never transmitted to the browser.
- Deterministic fallback rules ensure system resilience if the AI API is rate-limited, unreachable, or times out.

## 6. SQL Injection & Cross-Site Scripting (XSS)
- All database interactions use parameterized SQLAlchemy 2.0 ORM queries.
- React's JSX safely escapes user input by default, preventing reflected XSS.
