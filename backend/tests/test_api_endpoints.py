import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.main import app
from uuid import UUID


@pytest.fixture(scope="module")
def client():
    # Ensure the app is properly initialized for testing
    test_app = app
    with TestClient(test_app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "presidio_analyzer" in response.json()
    assert "token_map_service" in response.json()

def test_sanitize_text(client):
    text = "My name is John Doe and my email is john.doe@example.com."
    response = client.post(
        "/api/sanitize",
        json={
            "text": text,
            "presidio_config": {"entities": ["PERSON", "EMAIL_ADDRESS"]}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "sanitized_text" in data
    assert "token_map_id" in data
    assert "tokens" in data
    assert "[PERSON_1]" in data["sanitized_text"]
    assert "[EMAIL_ADDRESS_1]" in data["sanitized_text"]
    assert len(data["tokens"]) == 2
    assert UUID(data["token_map_id"])

def test_detokenize_text(client):
    # First, sanitize a text to get a token_map_id
    text = "My name is Jane Doe."
    sanitize_response = client.post(
        "/api/sanitize",
        json={
            "text": text,
            "presidio_config": {"entities": ["PERSON"]}
        }
    )
    assert sanitize_response.status_code == 200
    sanitize_data = sanitize_response.json()
    token_map_id = sanitize_data["token_map_id"]
    sanitized_text = sanitize_data["sanitized_text"]

    # Now, detokenize the sanitized text
    detokenize_response = client.post(
        "/api/detokenize",
        json={
            "token_map_id": token_map_id,
            "text": sanitized_text
        }
    )
    assert detokenize_response.status_code == 200
    detokenize_data = detokenize_response.json()
    assert "detokenized_text" in detokenize_data
    assert detokenize_data["detokenized_text"] == text

def test_detokenize_text_invalid_token_map_id(client):
    response = client.post(
        "/api/detokenize",
        json={
            "token_map_id": "00000000-0000-0000-0000-000000000000",
            "text": "Some text with [PERSON_1]"
        }
    )
    assert response.status_code == 404
    assert response.json()["code"] == "TOKEN_MAP_NOT_FOUND"

def test_update_token_map(client):
    # First, sanitize a text to get a token_map_id
    text = "My name is John Doe."
    sanitize_response = client.post(
        "/api/sanitize",
        json={
            "text": text,
            "presidio_config": {"entities": ["PERSON"]}
        }
    )
    assert sanitize_response.status_code == 200
    sanitize_data = sanitize_response.json()
    token_map_id = sanitize_data["token_map_id"]

    # Update the token
    update_response = client.post(
        "/api/tokens/update",
        json={
            "token_map_id": token_map_id,
            "updates": [
                {"token": "[PERSON_1]", "original_value": "Jane Smith", "entity_type": "PERSON"}
            ]
        }
    )
    assert update_response.status_code == 200
    assert update_response.json()["message"] == "Token map updated successfully."

    # Detokenize to verify the update
    sanitized_text = sanitize_data["sanitized_text"]
    detokenize_response = client.post(
        "/api/detokenize",
        json={
            "token_map_id": token_map_id,
            "text": sanitized_text
        }
    )
    assert detokenize_response.status_code == 200
    detokenize_data = detokenize_response.json()
    assert detokenize_data["detokenized_text"] == "My name is Jane Smith."

def test_delete_token_map(client):
    # First, sanitize a text to get a token_map_id
    text = "Some text to be deleted."
    sanitize_response = client.post(
        "/api/sanitize",
        json={
            "text": text,
            "presidio_config": {"entities": ["PERSON"]}
        }
    )
    assert sanitize_response.status_code == 200
    sanitize_data = sanitize_response.json()
    token_map_id = sanitize_data["token_map_id"]

    # Delete the token map
    delete_response = client.delete(f"/api/tokens/{token_map_id}")
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Token map deleted successfully."

    # Try to retrieve it, should fail
    response = client.post(
        "/api/detokenize",
        json={
            "token_map_id": token_map_id,
            "text": "Some text with [PERSON_1]"
        }
    )
    assert response.status_code == 404
    assert response.json()["code"] == "TOKEN_MAP_NOT_FOUND"
