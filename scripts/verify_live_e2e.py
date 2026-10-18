import os
import sys
import requests

# Configure UTF-8 for console output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

raw_base = os.environ.get("API_URL") or (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/api/v1")
raw_base = raw_base.rstrip("/")
BASE_URL = raw_base if raw_base.endswith("/api/v1") else f"{raw_base}/api/v1"

def run_live_e2e_verification():
    print("==================================================")
    print("BOOKLEAF LIVE PORTAL END-TO-END VERIFICATION")
    print("==================================================")

    # 1. Author Login
    print("\n[Step 1] Author Login (Priya Sharma - AUTH001)...")
    login_res = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "priya.sharma@email.com", "password": "AuthorDemo@2026"},
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    author_token = login_res.json()["access_token"]
    author_headers = {"Authorization": f"Bearer {author_token}"}
    print("[OK] Author successfully authenticated with JWT token.")

    # 2. Author Dashboard Stats
    print("\n[Step 2] Fetch Author Dashboard Stats...")
    stats_res = requests.get(f"{BASE_URL}/author/dashboard-stats", headers=author_headers)
    assert stats_res.status_code == 200, f"Stats failed: {stats_res.text}"
    stats = stats_res.json()
    print(f"✓ Author Name: {stats['author']['name']} (ID: {stats['author']['author_id']})")
    print(f"✓ Total Books: {stats['total_books']}, Published: {stats['published_books']}, Sold Copies: {stats['total_copies_sold']}")
    print(f"✓ Total Royalties: ₹{stats['total_royalty_earned']:,.2f}, Paid: ₹{stats['royalty_paid']:,.2f}, Pending: ₹{stats['royalty_pending']:,.2f}")
    assert stats["total_books"] == 2
    assert stats["published_books"] == 2
    assert stats["total_copies_sold"] == 531

    # 3. Author Books
    print("\n[Step 3] Fetch Author Catalog (My Books)...")
    books_res = requests.get(f"{BASE_URL}/author/books", headers=author_headers)
    assert books_res.status_code == 200
    books = books_res.json()
    assert len(books) == 2
    book1 = books[0]
    print(f"✓ Title 1: '{book1['title']}' (ISBN: {book1['isbn']}, Sold: {book1['total_copies_sold']})")
    print(f"✓ Title 2: '{books[1]['title']}' (ISBN: {books[1]['isbn']}, Sold: {books[1]['total_copies_sold']})")

    # 4. Author Royalties Summary
    print("\n[Step 4] Fetch Author Royalties Summary...")
    royalty_res = requests.get(f"{BASE_URL}/author/royalties", headers=author_headers)
    assert royalty_res.status_code == 200
    royalty_data = royalty_res.json()
    print(f"✓ Policy: {royalty_data['split_policy']}, Payout Window: {royalty_data['payout_window']}")
    assert royalty_data["split_policy"] == "80/20 Net Profit per Book"

    # 5. Author Submits Support Ticket
    print("\n[Step 5] Author Submits Support Ticket...")
    ticket_payload = {
        "book_id": book1["id"],
        "subject": "Inquiry regarding pending royalty disbursement",
        "description": "Hello support team, I see that I have a pending royalty balance of ₹3,570 on Whispers of the Ganges. Could you please let me know the scheduled disbursement date for this quarter?",
    }
    ticket_res = requests.post(f"{BASE_URL}/tickets", json=ticket_payload, headers=author_headers)
    assert ticket_res.status_code == 201, f"Ticket creation failed: {ticket_res.text}"
    ticket = ticket_res.json()
    ticket_id = ticket["id"]
    print(f"✓ Ticket Created: {ticket['ticket_number']}")
    print(f"✓ Auto-Classified Category: {ticket['category']}")
    print(f"✓ Auto-Assigned Priority: {ticket['priority']}")
    print(f"✓ Initial Status: {ticket['status']}")
    assert ticket["category"] == "Royalty & Payments"

    # 6. Admin Login
    print("\n[Step 6] Admin Login (admin@bookleaf.com)...")
    admin_login_res = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@bookleaf.com", "password": "AdminSecure@2026"},
    )
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("✓ Administrator authenticated with admin privileges.")

    # 7. Admin Queue
    print("\n[Step 7] Admin Fetches Ticket Queue...")
    queue_res = requests.get(f"{BASE_URL}/admin/tickets", headers=admin_headers)
    assert queue_res.status_code == 200
    queue = queue_res.json()
    matching_ticket = next((t for t in queue if t["id"] == ticket_id), None)
    assert matching_ticket is not None, "Created ticket not in admin queue!"
    print(f"✓ Located ticket in queue with author: {matching_ticket['author_name']}")

    # 8. Admin Assigns Ticket to Self
    print("\n[Step 8] Admin Assigns Ticket to Self...")
    assign_res = requests.post(f"{BASE_URL}/admin/tickets/{ticket_id}/assign-self", headers=admin_headers)
    assert assign_res.status_code == 200
    assigned_ticket = assign_res.json()
    print(f"✓ Assigned To: {assigned_ticket['assigned_admin_name']}, Status: {assigned_ticket['status']}")
    assert assigned_ticket["status"] == "In Progress"

    # 9. Admin Generates Grounded AI Draft Response
    print("\n[Step 9] Admin Generates Context-Aware AI Response Draft...")
    draft_res = requests.post(
        f"{BASE_URL}/admin/tickets/{ticket_id}/ai-draft",
        json={"custom_instructions": "Confirm ₹3,570 pending balance and 48-hour finance audit"},
        headers=admin_headers,
    )
    assert draft_res.status_code == 200, f"AI draft failed: {draft_res.text}"
    draft_data = draft_res.json()
    print(f"✓ AI Engine: {draft_data['model_used']}")
    print(f"✓ Grounding Facts Citing DB: {draft_data['grounding_facts']}")
    print(f"✓ Policies Applied: {draft_data['policy_references']}")
    print(f"✓ Generated Draft Preview:\n---\n{draft_data['draft_reply'][:180]}...\n---")

    # 10. Admin Adds Private Internal Note
    print("\n[Step 10] Admin Adds Private Internal Note...")
    note_payload = {
        "content": "CONFIDENTIAL INTERNAL NOTE: Checked with accounting. Priya Sharma's linked bank account is active. Q4 NEFT batch will execute on 20th."
    }
    note_res = requests.post(f"{BASE_URL}/admin/tickets/{ticket_id}/notes", json=note_payload, headers=admin_headers)
    assert note_res.status_code == 200
    print("✓ Private internal note saved in database.")

    # 11. Admin Publishes Response to Author
    print("\n[Step 11] Admin Edits and Publishes Response to Author...")
    pub_res = requests.post(
        f"{BASE_URL}/admin/tickets/{ticket_id}/publish-response",
        json={"content": draft_data["draft_reply"]},
        headers=admin_headers,
    )
    assert pub_res.status_code == 200
    print("✓ Response officially published to author.")

    # 12. Author Views Ticket and Verifies Privacy & Response
    print("\n[Step 12] Author Fetches Ticket Thread (Verifying Isolation)...")
    author_view_res = requests.get(f"{BASE_URL}/tickets/{ticket_id}", headers=author_headers)
    assert author_view_res.status_code == 200
    author_view = author_view_res.json()
    
    # Verify published response is visible
    assert len(author_view["messages"]) >= 2
    admin_msg = next((m for m in author_view["messages"] if m["sender_role"] == "admin"), None)
    assert admin_msg is not None, "Admin response not delivered to author!"
    print(f"✓ Author sees published response from: {admin_msg['sender_name']}")

    # Verify strict internal note isolation
    assert "internal_notes" not in author_view, "SECURITY ERROR: internal_notes field exposed in author payload!"
    for msg in author_view["messages"]:
        assert "CONFIDENTIAL INTERNAL NOTE" not in msg["content"], "SECURITY ERROR: internal note leaked in messages!"
    print("✓ Strict privacy verified: Internal notes are completely invisible to author.")

    print("\n==================================================")
    print("ALL 12 LIVE INTEGRATION STEPS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    run_live_e2e_verification()
