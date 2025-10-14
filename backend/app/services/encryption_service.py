import base64
import json
import logging
import os
from typing import Dict, Tuple

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Service for encrypting and decrypting token maps using Fernet symmetric encryption.
    """

    def _derive_key(self, passphrase: str, salt: bytes) -> bytes:
        """
        Derives a Fernet key from a passphrase and salt using PBKDF2HMAC.
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,  # Recommended iteration count
        )
        key = base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))
        return key

    def encrypt_token_map(self, data: Dict, passphrase: str) -> Tuple[bytes, bytes]:
        """
        Encrypts a token map dictionary using a passphrase.

        Args:
            data (Dict): The token map dictionary to encrypt.
            passphrase (str): The passphrase to use for encryption.

        Returns:
            Tuple[bytes, bytes]: A tuple containing the encrypted data and the salt used.
        """
        salt = os.urandom(16)  # Generate a random salt
        key = self._derive_key(passphrase, salt)
        fernet = Fernet(key)
        
        # Convert dictionary to string, then to bytes for encryption
        data_str = json.dumps(data)
        encrypted_data = fernet.encrypt(data_str.encode())
        
        logger.info("Token map encrypted successfully.")
        return encrypted_data, salt

    def decrypt_token_map(self, encrypted_data: bytes, salt: bytes, passphrase: str) -> Dict:
        """
        Decrypts an encrypted token map using a passphrase and salt.

        Args:
            encrypted_data (bytes): The encrypted token map data.
            salt (bytes): The salt used during encryption.
            passphrase (str): The passphrase to use for decryption.

        Returns:
            Dict: The decrypted token map dictionary.

        Raises:
            ValueError: If decryption fails (e.g., wrong passphrase, corrupted data).
        """
        try:
            key = self._derive_key(passphrase, salt)
            fernet = Fernet(key)
            decrypted_data_bytes = fernet.decrypt(encrypted_data)
            decrypted_data_str = decrypted_data_bytes.decode()
            
            logger.info("Token map decrypted successfully.")
            return json.loads(decrypted_data_str)
        except InvalidToken:
            logger.error("Decryption failed: Invalid token or wrong passphrase.")
            raise ValueError("Invalid passphrase or corrupted data.")
        except Exception as e:
            logger.error(f"An unexpected error occurred during decryption: {e}")
            raise ValueError(f"Decryption failed: {e}")
