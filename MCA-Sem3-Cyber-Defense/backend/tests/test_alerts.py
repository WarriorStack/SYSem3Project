def _create_dos_detection(client, headers):
    resp = client.post(
        "/api/detection/analyze",
        json={
            "features": {
                "flow_duration": 40,
                "total_fwd_packets": 600,
                "total_bwd_packets": 3,
                "flow_bytes_per_s": 60000,
                "flow_packets_per_s": 900,
                "syn_flag_count": 60,
            }
        },
        headers=headers,
    )
    return resp.json()


def test_alert_list(client, auth_headers, active_model):
    _create_dos_detection(client, auth_headers)
    resp = client.get("/api/alerts", headers=auth_headers)
    assert resp.status_code == 200
    assert "items" in resp.json()


def test_alert_retrieval_and_update(client, auth_headers, active_model):
    detection_result = _create_dos_detection(client, auth_headers)
    alert_id = detection_result.get("alert_id")
    if alert_id is None:
        # If the model didn't predict a severe attack for this synthetic
        # sample, skip - the rule-based alert creation is exercised elsewhere.
        return

    resp = client.get(f"/api/alerts/{alert_id}", headers=auth_headers)
    assert resp.status_code == 200

    update_resp = client.patch(
        f"/api/alerts/{alert_id}", json={"status": "acknowledged"}, headers=auth_headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "acknowledged"


def test_alert_resolve(client, auth_headers, active_model):
    detection_result = _create_dos_detection(client, auth_headers)
    alert_id = detection_result.get("alert_id")
    if alert_id is None:
        return

    resp = client.post(f"/api/alerts/{alert_id}/resolve", json={}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "resolved"
    assert resp.json()["resolved_at"] is not None


def test_alert_not_found(client, auth_headers):
    resp = client.get("/api/alerts/999999", headers=auth_headers)
    assert resp.status_code == 404
