def test_detection_without_active_model_returns_503(client, auth_headers):
    resp = client.post(
        "/api/detection/analyze",
        json={"features": {"flow_duration": 100, "total_fwd_packets": 5}},
        headers=auth_headers,
    )
    assert resp.status_code == 503


def test_valid_detection(client, auth_headers, active_model):
    resp = client.post(
        "/api/detection/analyze",
        json={
            "features": {
                "source_ip": "10.0.0.5",
                "destination_ip": "10.0.0.1",
                "flow_duration": 40,
                "total_fwd_packets": 600,
                "total_bwd_packets": 3,
                "flow_bytes_per_s": 60000,
                "flow_packets_per_s": 900,
                "syn_flag_count": 60,
            }
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["detection"]["attack_type"] in [
        "benign", "dos", "port_scan", "brute_force", "botnet", "web_attack",
    ]
    assert 0 <= body["detection"]["confidence"] <= 1
    assert 0 <= body["detection"]["risk_score"] <= 100
    assert body["detection"]["explanation"]


def test_detection_persists_and_retrievable(client, auth_headers, active_model):
    resp = client.post(
        "/api/detection/analyze",
        json={"features": {"flow_duration": 500, "total_fwd_packets": 20}},
        headers=auth_headers,
    )
    detection_id = resp.json()["detection"]["id"]

    get_resp = client.get(f"/api/detection/{detection_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == detection_id


def test_detection_invalid_id_returns_404(client, auth_headers, active_model):
    resp = client.get("/api/detection/999999", headers=auth_headers)
    assert resp.status_code == 404


def test_batch_detection(client, auth_headers, active_model):
    resp = client.post(
        "/api/detection/batch",
        json={
            "records": [
                {"flow_duration": 500, "total_fwd_packets": 20},
                {"flow_duration": 30, "total_fwd_packets": 500, "syn_flag_count": 50},
            ]
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["processed"] == 2
    assert body["failed"] == 0


def test_batch_detection_empty_rejected(client, auth_headers, active_model):
    resp = client.post("/api/detection/batch", json={"records": []}, headers=auth_headers)
    assert resp.status_code == 400


def test_detection_list_pagination(client, auth_headers, active_model):
    for _ in range(3):
        client.post(
            "/api/detection/analyze",
            json={"features": {"flow_duration": 500, "total_fwd_packets": 20}},
            headers=auth_headers,
        )
    resp = client.get("/api/detection?page=1&page_size=2", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["items"]) == 2
    assert body["total"] == 3
