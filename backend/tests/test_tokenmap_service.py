import pytest
import time
from uuid import UUID

from app.services.tokenmap_service import TokenMapService
from app.models.requests import TokenUpdate

@pytest.fixture
def token_map_service():
    # Use a short TTL for testing purposes
    service = TokenMapService(ttl_seconds=1)
    yield service
    # Ensure cleanup task is stopped after tests
    service._cleanup_timer.cancel()

def test_create_token_map(token_map_service):
    mappings = {"token1": {"original_value": "value1", "entity_type": "PERSON"}}
    token_map_id = token_map_service.create_token_map(mappings)
    assert isinstance(token_map_id, UUID)
    assert token_map_service.get_token_map(token_map_id) == mappings

def test_get_token_map_not_found(token_map_service):
    non_existent_id = UUID('00000000-0000-0000-0000-000000000000')
    assert token_map_service.get_token_map(non_existent_id) is None

def test_token_map_expiration(token_map_service):
    mappings = {"token1": {"original_value": "value1", "entity_type": "PERSON"}}
    token_map_id = token_map_service.create_token_map(mappings)
    assert token_map_service.get_token_map(token_map_id) == mappings
    time.sleep(1.5)  # Wait for TTL to expire
    assert token_map_service.get_token_map(token_map_id) is None

def test_update_token_map(token_map_service):
    initial_mappings = {"token1": {"original_value": "value1", "entity_type": "PERSON"}}
    token_map_id = token_map_service.create_token_map(initial_mappings)

    updates = [
        TokenUpdate(token="token1", original_value="newValue1", entity_type="PERSON"),
        TokenUpdate(token="token2", original_value="newValue2", entity_type="LOCATION") # Non-existent token
    ]
    
    success = token_map_service.update_token_map(token_map_id, updates)
    assert success
    updated_map = token_map_service.get_token_map(token_map_id)
    assert updated_map["token1"]["original_value"] == "newValue1"
    assert "token2" not in updated_map # Should not add new tokens

def test_delete_token_map(token_map_service):
    mappings = {"token1": {"original_value": "value1", "entity_type": "PERSON"}}
    token_map_id = token_map_service.create_token_map(mappings)
    assert token_map_service.get_token_map(token_map_id) is not None

    success = token_map_service.delete_token_map(token_map_id)
    assert success
    assert token_map_service.get_token_map(token_map_id) is None

def test_delete_non_existent_token_map(token_map_service):
    non_existent_id = UUID('00000000-0000-0000-0000-000000000000')
    success = token_map_service.delete_token_map(non_existent_id)
    assert not success
