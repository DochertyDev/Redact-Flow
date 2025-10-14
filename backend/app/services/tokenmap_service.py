import logging
import time
from threading import Timer
from typing import Dict, List, Optional, Tuple
from uuid import UUID, uuid4

from app.models.requests import TokenUpdate

logger = logging.getLogger(__name__)


class TokenMapData:
    """
    Holds token mapping data along with its creation and expiry timestamps,
    original text, and raw recognizer results.
    """

    def __init__(self, mappings: Dict[str, Dict], original_text: str, tokens_info_raw: List[Dict], ttl_seconds: int):
        self.mappings = mappings
        self.original_text = original_text
        self.tokens_info_raw = tokens_info_raw
        self.created_at = time.time()
        self.expires_at = self.created_at + ttl_seconds

    def is_expired(self) -> bool:
        return time.time() > self.expires_at


class TokenMapService:
    """
    Service for managing in-memory token mappings with a time-to-live (TTL).
    """

    def __init__(self, ttl_seconds: int = 3600, cleanup_interval_seconds: int = 300):
        self.token_maps: Dict[UUID, TokenMapData] = {}
        self.ttl_seconds = ttl_seconds
        self.cleanup_interval_seconds = cleanup_interval_seconds
        self._start_cleanup_task()
        logger.info(f"TokenMapService initialized with TTL: {ttl_seconds}s, Cleanup Interval: {cleanup_interval_seconds}s")

    def _start_cleanup_task(self):
        """
        Starts a background task to periodically clean up expired token maps.
        """
        self._cleanup_timer = Timer(self.cleanup_interval_seconds, self._cleanup_expired_maps)
        self._cleanup_timer.daemon = True  # Allow program to exit even if timer is running
        self._cleanup_timer.start()
        logger.debug("Started background cleanup task for token maps.")

    def _cleanup_expired_maps(self):
        """
        Removes expired token maps from storage.
        """
        expired_ids = [uid for uid, data in self.token_maps.items() if data.is_expired()]
        for uid in expired_ids:
            del self.token_maps[uid]
            logger.info(f"Cleaned up expired token map: {uid}")
        
        # Reschedule the cleanup task
        self._start_cleanup_task()
        logger.debug(f"Token map cleanup completed. {len(expired_ids)} maps removed.")

    def create_token_map(self, mappings: Dict[str, Dict], original_text: str, tokens_info_raw: List[Dict]) -> UUID:
        """
        Creates a new token map and stores it.

        Args:
            mappings (Dict[str, Dict]): A dictionary mapping tokens to their original values and entity types.

        Returns:
            UUID: The unique ID of the created token map.
        """
        token_map_id = uuid4()
        self.token_maps[token_map_id] = TokenMapData(mappings, original_text, tokens_info_raw, self.ttl_seconds)
        logger.info(f"Created token map {token_map_id} with {len(mappings)} entries.")
        return token_map_id

    def get_token_map(self, token_map_id: UUID) -> Optional[Dict[str, Dict]]:
        """
        Retrieves a token map by its ID.

        Args:
            token_map_id (UUID): The ID of the token map to retrieve.

        Returns:
            Optional[Dict[str, Dict]]: The token map if found and not expired, otherwise None.
        """
        token_map_data = self.token_maps.get(token_map_id)
        if token_map_data:
            if token_map_data.is_expired():
                self.delete_token_map(token_map_id)  # Clean up expired map immediately
                logger.warning(f"Attempted to retrieve expired token map: {token_map_id}")
                return None
            return token_map_data.mappings
        logger.warning(f"Token map {token_map_id} not found.")
        return None

    def update_token_map(self, token_map_id: UUID, updates: List[TokenUpdate]) -> bool:
        """
        Updates an existing token map with new values for specific tokens.

        Args:
            token_map_id (UUID): The ID of the token map to update.
            updates (List[TokenUpdate]): A list of TokenUpdate objects containing the new values.

        Returns:
            bool: True if the update was successful, False otherwise.
        """
        token_map_data = self.token_maps.get(token_map_id)
        if not token_map_data or token_map_data.is_expired():
            logger.warning(f"Cannot update: Token map {token_map_id} not found or expired.")
            return False

        for update in updates:
            if update.token in token_map_data.mappings:
                token_map_data.mappings[update.token]["original_value"] = update.original_value
                token_map_data.mappings[update.token]["entity_type"] = update.entity_type
                logger.debug(f"Updated token {update.token} in map {token_map_id}.")
            else:
                logger.warning(f"Token {update.token} not found in map {token_map_id} during update.")
        logger.info(f"Token map {token_map_id} updated with {len(updates)} changes.")
        return True

    def delete_token_map(self, token_map_id: UUID) -> bool:
        """
        Deletes a token map by its ID.

        Args:
            token_map_id (UUID): The ID of the token map to delete.

        Returns:
            bool: True if the token map was deleted, False if not found.
        """
        if token_map_id in self.token_maps:
            del self.token_maps[token_map_id]
            logger.info(f"Deleted token map: {token_map_id}")
            return True
        logger.warning(f"Attempted to delete non-existent token map: {token_map_id}")
        return False

    def get_token_map_entry(self, token_map_id: UUID) -> Optional[TokenMapData]:
        """
        Retrieves a TokenMapData entry by its ID.
        """
        token_map_data = self.token_maps.get(token_map_id)
        if token_map_data:
            if token_map_data.is_expired():
                self.delete_token_map(token_map_id)
                logger.warning(f"Attempted to retrieve expired token map entry: {token_map_id}")
                return None
            return token_map_data
        logger.warning(f"Token map entry {token_map_id} not found.")
        return None

    def update_token_map_entry_after_manual_tokenization(
        self,
        token_map_id: UUID,
        sanitized_text: str,
        token_mapping: Dict[str, Dict],
        tokens_info: List[Dict],
        tokens_info_raw: List # Updated raw RecognizerResults
    ) -> bool:
        """
        Updates an existing token map entry after manual tokenization has occurred.
        This updates the mappings, raw results, and extends the expiry.
        """
        token_map_data = self.token_maps.get(token_map_id)
        if not token_map_data or token_map_data.is_expired():
            logger.warning(f"Cannot update after manual tokenization: Token map {token_map_id} not found or expired.")
            return False

        token_map_data.mappings = token_mapping
        token_map_data.tokens_info_raw = tokens_info_raw
        # Extend expiry time as the map has been actively used/modified
        token_map_data.created_at = time.time()
        token_map_data.expires_at = token_map_data.created_at + self.ttl_seconds
        logger.info(f"Token map {token_map_id} updated after manual tokenization.")
        return True
