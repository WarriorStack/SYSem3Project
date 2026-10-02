def test_detection_missing_features_still_processed_with_defaults(client, auth_headers, active_model):
    # Missing numeric fields should be imputed by the preprocessing pipeline, not rejected.
    resp = client.post("/api/detection/analyze", json={"features": {}}, headers=auth_headers)
    assert resp.status_code == 201


def test_detection_malformed_request_rejected(client, auth_headers):
    resp = client.post("/api/detection/analyze", json={}, headers=auth_headers)
    assert resp.status_code == 422


def test_invalid_detection_id_type(client, auth_headers):
    resp = client.get("/api/detection/not-an-id", headers=auth_headers)
    assert resp.status_code == 422


def test_unauthorized_access_to_every_protected_route(client):
    protected_get_routes = [
        "/api/dashboard/summary",
        "/api/detection",
        "/api/alerts",
        "/api/incidents",
        "/api/threats",
        "/api/mitre/techniques",
        "/api/analytics/overview",
        "/api/reports",
        "/api/models",
        "/api/users/me",
    ]
    for route in protected_get_routes:
        resp = client.get(route)
        assert resp.status_code == 401, f"{route} should require authentication"


def test_model_unavailable_returns_503_not_fake_result(client, auth_headers):
    # No active_model fixture used here on purpose - simulates a fresh
    # deployment with no trained/registered model yet.
    resp = client.post(
        "/api/detection/analyze",
        json={"features": {"flow_duration": 10}},
        headers=auth_headers,
    )
    assert resp.status_code == 503
