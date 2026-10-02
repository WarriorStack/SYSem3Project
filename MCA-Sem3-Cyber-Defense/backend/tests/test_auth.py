def test_register_success(client):
    resp = client.post(
        "/api/auth/register",
        json={"name": "Alice Analyst", "email": "alice@example.com", "password": "StrongPass123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["role"] == "analyst"
    assert "access_token" in body


def test_register_duplicate_email(client):
    payload = {"name": "Alice", "email": "dup@example.com", "password": "StrongPass123"}
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


def test_login_success(client):
    client.post(
        "/api/auth/register",
        json={"name": "Bob", "email": "bob@example.com", "password": "StrongPass123"},
    )
    resp = client.post("/api/auth/login", json={"email": "bob@example.com", "password": "StrongPass123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_invalid_password(client):
    client.post(
        "/api/auth/register",
        json={"name": "Carl", "email": "carl@example.com", "password": "StrongPass123"},
    )
    resp = client.post("/api/auth/login", json={"email": "carl@example.com", "password": "WrongPassword"})
    assert resp.status_code == 401


def test_protected_route_requires_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_protected_route_with_token(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "analyst@example.com"


def test_role_cannot_be_self_elevated(client, auth_headers):
    # role is intentionally not part of UserUpdateRequest, so sending it must be ignored
    resp = client.patch("/api/users/me", json={"role": "admin"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["role"] == "analyst"
