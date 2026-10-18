def test_ticket_auto_classification_and_lifecycle(client):
    # 1. Author login
    login_author = client.post(
        "/api/v1/auth/login",
        json={"email": "author1@example.com", "password": "AuthorPass@123"},
    )
    author_token = login_author.json()["access_token"]

    # 2. Submit high-priority royalty ticket
    ticket_payload = {
        "subject": "Haven't received royalty for 6 months",
        "description": "I published my book and have not received any royalty payout for 6 months. Please help.",
    }
    create_res = client.post(
        "/api/v1/tickets",
        json=ticket_payload,
        headers={"Authorization": f"Bearer {author_token}"},
    )
    assert create_res.status_code == 201
    ticket = create_res.json()
    ticket_id = ticket["id"]
    assert ticket["category"] == "Royalty & Payments"
    assert ticket["priority"] == "Critical"
    assert ticket["status"] == "Open"

    # 3. Admin login
    login_admin = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "AdminPass@123"},
    )
    admin_token = login_admin.json()["access_token"]

    # 4. Admin views queue
    queue_res = client.get(
        "/api/v1/admin/tickets?priority=Critical",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert queue_res.status_code == 200
    queue = queue_res.json()
    assert any(t["id"] == ticket_id for t in queue)

    # 5. Admin assigns ticket to self
    assign_res = client.post(
        f"/api/v1/admin/tickets/{ticket_id}/assign-self",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_admin_name"] == "Operations Manager"
    assert assign_res.json()["status"] == "In Progress"

    # 6. Admin overrides priority to High
    prio_res = client.patch(
        f"/api/v1/admin/tickets/{ticket_id}/priority",
        json={"priority": "High", "reason": "Adjusted per preliminary finance check"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert prio_res.status_code == 200
    assert prio_res.json()["priority"] == "High"
    assert prio_res.json()["priority_source"] == "manual"

    # 7. Admin generates AI draft response
    draft_res = client.post(
        f"/api/v1/admin/tickets/{ticket_id}/ai-draft",
        json={},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert draft_res.status_code == 200
    draft_data = draft_res.json()
    assert "draft_reply" in draft_data
    assert "80/20" in draft_data["draft_reply"] or "royalty" in draft_data["draft_reply"].lower()

    # 8. Admin publishes response
    pub_res = client.post(
        f"/api/v1/admin/tickets/{ticket_id}/publish-response",
        json={"content": draft_data["draft_reply"]},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert pub_res.status_code == 200
    published_msg = pub_res.json()
    assert published_msg["is_published"] is True
    assert published_msg["sender_role"] == "admin"

    # 9. Author views ticket and sees the published admin response
    author_check_res = client.get(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {author_token}"},
    )
    assert author_check_res.status_code == 200
    author_ticket = author_check_res.json()
    assert len(author_ticket["messages"]) >= 2
    assert any(m["sender_role"] == "admin" for m in author_ticket["messages"])

    # 10. Admin marks ticket as Resolved
    status_res = client.patch(
        f"/api/v1/admin/tickets/{ticket_id}/status",
        json={"status": "Resolved"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "Resolved"
