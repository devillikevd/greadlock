import pytest
from datetime import datetime
from backend.app.db.models import IncidentType, Severity, IncidentStatus

pytestmark = pytest.mark.asyncio

# --- 1. AUTH TESTS ---
async def test_login_success(client):
    response = await client.post(
        "/auth/login",
        json={"email": "inspector@btp.gov.in", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "inspector"
    assert data["name"] == "Inspector Suresh Kumar"

async def test_login_failure(client):
    response = await client.post(
        "/auth/login",
        json={"email": "inspector@btp.gov.in", "password": "wrongpassword"}
    )
    assert response.status_code == 401

async def test_get_me(client):
    # Log in first
    login_resp = await client.post(
        "/auth/login",
        json={"email": "inspector@btp.gov.in", "password": "password123"}
    )
    token = login_resp.json()["access_token"]
    
    response = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "inspector@btp.gov.in"

# --- 2. JUNCTION TESTS ---
async def test_list_junctions(client):
    response = await client.get("/junctions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "silk-board"
    assert data[0]["level"] == "MEDIUM"

async def test_get_junction_detail(client):
    response = await client.get("/junctions/silk-board")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "silk-board"
    assert len(data["lanes"]) == 4
    assert len(data["last_3_hours_readings"]) == 1

async def test_get_junction_detail_not_found(client):
    response = await client.get("/junctions/invalid-id")
    assert response.status_code == 404

async def test_get_junction_readings(client):
    response = await client.get("/junctions/silk-board/readings?hours=3")
    assert response.status_code == 200
    assert len(response.json()) == 1

async def test_get_junction_predictions(client):
    response = await client.get("/junctions/silk-board/predictions")
    assert response.status_code == 200
    data = response.json()["predictions"]
    assert "15min" in data
    assert "3hr" in data
    assert data["15min"]["level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# --- 3. INCIDENT TESTS ---
async def test_create_and_list_incidents(client):
    # Create incident
    create_resp = await client.post(
        "/incidents",
        json={
            "junction_id": "silk-board",
            "type": "accident",
            "severity": "P0",
            "description": "Collision between auto and car"
        }
    )
    assert create_resp.status_code == 200
    inc_id = create_resp.json()["id"]
    
    # List incidents
    list_resp = await client.get("/incidents?status=open")
    assert list_resp.status_code == 200
    incidents = list_resp.json()
    assert len(incidents) >= 1
    assert incidents[0]["id"] == inc_id

async def test_patch_incident(client):
    create_resp = await client.post(
        "/incidents",
        json={
            "junction_id": "silk-board",
            "type": "stopped_vehicle",
            "severity": "P1",
            "description": "Breakdown near flyover ramp"
        }
    )
    inc_id = create_resp.json()["id"]
    
    # Patch
    patch_resp = await client.patch(
        f"/incidents/{inc_id}",
        json={"status": "in_progress", "assigned_officer_id": 1}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "in_progress"
    assert patch_resp.json()["assigned_officer_id"] == 1

# --- 4. RECOMMENDATION TESTS ---
async def test_recommendations(client):
    # List (should be empty initially in this setup, or populated by default)
    resp = await client.get("/recommendations")
    assert resp.status_code == 200

# --- 5. SIGNAL TESTS ---
async def test_get_and_apply_signals(client):
    # Get current timing
    get_resp = await client.get("/signals/silk-board")
    assert get_resp.status_code == 200
    
    # Apply Timing
    apply_resp = await client.post(
        "/signals/silk-board/apply",
        json={"north_green": 50, "south_green": 50, "east_green": 40, "west_green": 40}
    )
    assert apply_resp.status_code == 200
    assert apply_resp.json()["north_green"] == 50
    assert apply_resp.json()["mode"] == "ai_adaptive"

async def test_simulate_signals(client):
    resp = await client.post("/signals/simulate", json={"junction_id": "silk-board"})
    assert resp.status_code == 200
    data = resp.json()
    assert "fixed" in data
    assert "ai" in data
    assert "wait_reduction_pct" in data

# --- 6. EMERGENCY TESTS ---
async def test_emergency_corridor(client):
    # Activate corridor
    # Silk Board is the starting node, Hebbal is destination
    resp = await client.post(
        "/emergency/corridor",
        json={
            "ambulance_id": "AMB-KA-1111",
            "current_lat": 12.9175,
            "current_lng": 77.6229,
            "destination_junction_id": "silk-board"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "corridor_id" in data
    assert data["status"] == "active"
    corridor_id = data["corridor_id"]
    
    # Get details
    get_resp = await client.get(f"/emergency/corridor/{corridor_id}")
    assert get_resp.status_code == 200
    
    # Deactivate
    del_resp = await client.delete(f"/emergency/corridor/{corridor_id}")
    assert del_resp.status_code == 200

# --- 7. ANALYTICS TESTS ---
async def test_analytics(client):
    resp = await client.get("/analytics/city-summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_vehicles" in data
    assert "avg_speed" in data
    
    rank_resp = await client.get("/analytics/junction-rankings")
    assert rank_resp.status_code == 200
    
    em_resp = await client.get("/analytics/emissions")
    assert em_resp.status_code == 200

# --- 8. CHAT TESTS ---
async def test_chat_message(client):
    resp = await client.post(
        "/chat/message",
        json={"message": "What is the traffic density at Silk Board?", "session_id": "session-1"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "content" in data
    assert "confidence" in data
    
    hist_resp = await client.get("/chat/history/session-1")
    assert hist_resp.status_code == 200
    assert len(hist_resp.json()) >= 3 # Starter + user + AI response

# --- 9. VIDEO TESTS ---
async def test_video_endpoints(client):
    resp = await client.get("/video/detections/silk-board")
    assert resp.status_code == 200
    data = resp.json()
    assert "vehicle_counts" in data
    assert "density_pct" in data
