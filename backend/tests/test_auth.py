def test_author_login_success(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "author1@example.com", "password": "AuthorPass@123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "author1@example.com"
    assert data["user"]["role"] == "author"
    assert data["user"]["author_id"] == "AUTH_TEST_1"


def test_author_login_invalid_password(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "author1@example.com", "password": "WrongPassword"},
    )
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]


def test_admin_login_success(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "AdminPass@123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "admin"


def test_current_user_me_endpoint(client):
    # Login as author1
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "author1@example.com", "password": "AuthorPass@123"},
    )
    token = login_res.json()["access_token"]

    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["email"] == "author1@example.com"


def test_refresh_token_flow(client):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "author1@example.com", "password": "AuthorPass@123"},
    )
    refresh_token = login_res.json()["refresh_token"]

    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()
