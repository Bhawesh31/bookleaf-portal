# REST API Specification: BookLeaf Portal

Base URL: `/api/v1`

## Authentication Endpoints

### `POST /auth/login`
Authenticates an author or administrator.
- **Request Body**:
  ```json
  {
    "email": "priya.sharma@email.com",
    "password": "AuthorDemo@2026"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "priya.sharma@email.com",
      "full_name": "Priya Sharma",
      "role": "author",
      "author_id": "AUTH001"
    }
  }
  ```

### `POST /auth/refresh`
Refreshes an access token using a valid refresh token.

### `GET /auth/me`
Retrieves the authenticated user profile.

---

## Author Portal Endpoints

### `GET /author/dashboard-stats`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Aggregated author stats including total titles, copies sold, royalties earned/paid/pending, and recent tickets.

### `GET /author/books`
- **Parameters**: `search`, `genre`, `status`, `sort_by`
- **Response**: List of books belonging strictly to the authenticated author.

### `GET /author/royalties`
- **Response**: Summary totals (earned, paid, pending), 80/20 policy details, and per-book statements.

---

## Ticket Endpoints

### `POST /tickets`
Submits a support query. Triggers AI classification and priority scoring.
- **Request Body**:
  ```json
  {
    "book_id": "optional-book-uuid",
    "subject": "Missing Q3 royalty payout",
    "description": "I have not received my quarterly royalty payout for my title...",
    "attachment_filename": null
  }
  ```

### `GET /tickets`
Lists tickets. Authors receive only their own tickets; admins receive all tickets.

### `GET /tickets/{id}`
Retrieves ticket detail and conversation thread. Strictly excludes internal notes for author clients.

### `POST /tickets/{id}/reply`
Posts a follow-up response to the ticket thread.

---

## Admin Operations Endpoints

### `GET /admin/dashboard-stats`
Returns system-wide operational metrics: total, open, in-progress, resolved, critical tickets, and calculated average response time in hours.

### `GET /admin/tickets`
- **Parameters**: `status`, `category`, `priority`, `assigned_admin_id`, `search`, `sort_strategy` ("urgency", "oldest", "newest")
- **Response**: Prioritized ticket queue with author and book context.

### `PATCH /admin/tickets/{id}/status`
Updates ticket status (`Open`, `In Progress`, `Resolved`, `Closed`).

### `PATCH /admin/tickets/{id}/priority`
Overrides ticket priority (`Critical`, `High`, `Medium`, `Low`).

### `PATCH /admin/tickets/{id}/category`
Overrides ticket category.

### `POST /admin/tickets/{id}/assign-self`
Assigns the ticket to the calling administrator.

### `POST /admin/tickets/{id}/notes`
Adds a private internal note (visible only to admins).

### `POST /admin/tickets/{id}/ai-draft`
Generates a context-aware AI draft response citing Knowledge Base policies and verified author database facts.

### `POST /admin/tickets/{id}/publish-response`
Publishes an approved/edited draft to the author.
