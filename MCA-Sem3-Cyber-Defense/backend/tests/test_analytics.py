def test_analytics_overview_empty(client, auth_headers):
    resp = client.get("/api/analytics/overview", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_detections"] == 0
    assert body["malicious_ratio"] == 0.0


def test_analytics_overview_after_detection(client, auth_headers, active_model):
    client.post(
        "/api/detection/analyze",
        json={"features": {"flow_duration": 500, "total_fwd_packets": 20}},
        headers=auth_headers,
    )
    resp = client.get("/api/analytics/overview", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total_detections"] == 1


def test_analytics_attacks(client, auth_headers, active_model):
    client.post(
        "/api/detection/analyze",
        json={"features": {"flow_duration": 500, "total_fwd_packets": 20}},
        headers=auth_headers,
    )
    resp = client.get("/api/analytics/attacks", headers=auth_headers)
    assert resp.status_code == 200
    assert "frequency" in resp.json()


def test_dashboard_summary(client, auth_headers):
    resp = client.get("/api/dashboard/summary", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_detections"] == 0
    assert body["active_alerts"] == 0


def test_reports_with_date_filter(client, auth_headers):
    resp = client.get(
        "/api/reports?start_date=2020-01-01&end_date=2030-01-01",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["filters"]["start_date"] is not None


def test_reports_invalid_date_format(client, auth_headers):
    resp = client.get("/api/reports?start_date=not-a-date", headers=auth_headers)
    assert resp.status_code == 400
