def test_author_can_only_see_own_books(client):
    # Login author 1
    login_1 = client.post(
        "/api/v1/auth/login",
        json={"email": "author1@example.com", "password": "AuthorPass@123"},
    )
    token_1 = login_1.json()["access_token"]

    res_1 = client.get("/api/v1/author/books", headers={"Authorization": f"Bearer {token_1}"})
    assert res_1.status_code == 200
    books_1 = res_1.json()
    assert len(books_1) == 1
    assert books_1[0]["title"] == "Test Book One"

    # Login author 2 (has 0 books seeded)
    login_2 = client.post(
        "/api/v1/auth/login",
        json={"email": "author2@example.com", "password": "AuthorPass@123"},
    )
    token_2 = login_2.json()["access_token"]

    res_2 = client.get("/api/v1/author/books", headers={"Authorization": f"Bearer {token_2}"})
    assert res_2.status_code == 200
    books_2 = res_2.json()
    assert len(books_2) == 0  # isolated: Author 2 cannot see Author 1's book!


def test_author_cannot_access_other_author_ticket(client):
    # Author 1 creates a ticket
    login_1 = client.post(
        "/api/v1/auth/login",
        json={"email": "author1@example.com", "password": "AuthorPass@123"},
    )
    token_1 = login_1.json()["access_token"]

    ticket_res = client.post(
        "/api/v1/tickets",
        json={
            "subject": "Royalty payout inquiry",
            "description": "I have not received my quarterly royalty payout for Test Book One.",
        },
        headers={"Authorization": f"Bearer {token_1}"},
    )
    assert ticket_res.status_code == 201
    ticket_id = ticket_res.json()["id"]

    # Author 2 attempts to access Author 1's ticket
    login_2 = client.post(
        "/api/v1/auth/login",
        json={"email": "author2@example.com", "password": "AuthorPass@123"},
    )
    token_2 = login_2.json()["access_token"]

    forbidden_res = client.get(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {token_2}"},
    )
    assert forbidden_res.status_code == 403
    assert "permission" in forbidden_res.json()["detail"].lower()


def test_author_never_sees_internal_notes(client):
    # 1. Author 1 creates a ticket
    login_author = client.post(
        "/api/v1/auth/login",
        json={"email": "author1@example.com", "password": "AuthorPass@123"},
    )
    author_token = login_author.json()["access_token"]

    ticket_res = client.post(
        "/api/v1/tickets",
        json={
            "subject": "Print defect in author copies",
            "description": "The front cover binding was misaligned on my copies.",
        },
        headers={"Authorization": f"Bearer {author_token}"},
    )
    ticket_id = ticket_res.json()["id"]

    # 2. Admin logs in and adds a private internal note
    login_admin = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "AdminPass@123"},
    )
    admin_token = login_admin.json()["access_token"]

    note_res = client.post(
        f"/api/v1/admin/tickets/{ticket_id}/notes",
        json={"content": "CONFIDENTIAL: Checked with Repro India printer. Batch #49 had a roller slip."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert note_res.status_code == 200

    # 3. Author fetches ticket details
    author_view_res = client.get(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {author_token}"},
    )
    assert author_view_res.status_code == 200
    author_ticket = author_view_res.json()

    # Verify internal note is NEVER exposed to author
    assert "internal_notes" not in author_ticket
    for msg in author_ticket.get("messages", []):
        assert "CONFIDENTIAL" not in msg["content"]
        assert "roller slip" not in msg["content"]
