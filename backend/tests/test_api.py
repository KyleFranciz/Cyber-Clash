
from fastapi.testclient import TestClient
from app.main import app, sessions

# Create a test client for our FastAPI application
client = TestClient(app)


def test_health():
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_challenges():
    response = client.get("/api/challenges")

    assert response.status_code == 200

    challenges = response.json()

    assert len(challenges) >= 2

    # Verify secret answers are not exposed
    for challenge in challenges:
        assert "best_action" not in challenge
        assert "is_malicious" not in challenge
        assert "action_outcome" not in challenge


def test_create_session():
    response = client.post(
        "/api/session",
        json={"difficulty": "standard"}
    )

    assert response.status_code == 200

    data = response.json()

    assert "session_id" in data
    assert data["power"] == 85

    # Remove the test session from memory
    sessions.pop(data["session_id"], None)


def test_ai_hint_power_cost():
    # Create a new session
    response = client.post(
        "/api/session",
        json={"difficulty": "standard"}
    )

    session_id = response.json()["session_id"]

    # Request an AI hint
    response = client.post(
        "/api/hint",
        json={
            "session_id": session_id,
            "challenge_id": "N1-EM-001"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["charged"] is True
    assert data["power"] == 79

    # Request the same hint again
    second_response = client.post(
        "/api/hint",
        json={
            "session_id": session_id,
            "challenge_id": "N1-EM-001"
        }
    )

    assert second_response.status_code == 200
    assert second_response.json()["charged"] is False
    assert second_response.json()["power"] == 79

    sessions.pop(session_id, None)


def test_invalid_session():
    response = client.post(
        "/api/hint",
        json={
            "session_id": "invalid-session",
            "challenge_id": "N1-EM-001"
        }
    )

    assert response.status_code == 404


def test_invalid_challenge_does_not_charge():
    session_response = client.post(
        "/api/session",
        json={"difficulty": "standard"}
    )

    session_id = session_response.json()["session_id"]

    response = client.post(
        "/api/hint",
        json={
            "session_id": session_id,
            "challenge_id": "INVALID"
        }
    )

    assert response.status_code == 404
    assert sessions[session_id].power == 85

    sessions.pop(session_id, None)
