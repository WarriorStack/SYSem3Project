def test_create_incident(client, auth_headers):
    resp = client.post(
        "/api/incidents",
        json={"title": "Suspicious DoS activity", "description": "Multiple alerts correlated", "severity": "high"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Suspicious DoS activity"
    assert body["status"] == "open"


def test_list_incidents(client, auth_headers):
    client.post(
        "/api/incidents",
        json={"title": "Incident A", "severity": "medium"},
        headers=auth_headers,
    )
    resp = client.get("/api/incidents", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_update_incident(client, auth_headers):
    create_resp = client.post(
        "/api/incidents",
        json={"title": "Incident B", "severity": "low"},
        headers=auth_headers,
    )
    incident_id = create_resp.json()["id"]

    update_resp = client.patch(
        f"/api/incidents/{incident_id}",
        json={"status": "resolved"},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "resolved"
    assert update_resp.json()["resolved_at"] is not None


def test_incident_requires_authorization(client):
    resp = client.post("/api/incidents", json={"title": "X", "severity": "low"})
    assert resp.status_code == 401


def test_incident_not_found(client, auth_headers):
    resp = client.get("/api/incidents/999999", headers=auth_headers)
    assert resp.status_code == 404


def test_incident_with_invalid_alert_ids_rejected(client, auth_headers):
    resp = client.post(
        "/api/incidents",
        json={"title": "Incident C", "severity": "medium", "alert_ids": [999999]},
        headers=auth_headers,
    )
    assert resp.status_code == 400
