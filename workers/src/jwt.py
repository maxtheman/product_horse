import hmac
import hashlib
import base64
import json
from typing import Dict, Any
from cf_types import JwtPayload

def decode_jwt(token: str, secret: str):
    try:
        header_b64, payload_b64, signature_b64 = token.split('.')

        payload: JwtPayload = json.loads(base64.urlsafe_b64decode(payload_b64 + '==').decode('utf-8'))

        message = f"{header_b64}.{payload_b64}".encode('utf-8')
        secret_bytes = secret.encode('utf-8')
        signature = base64.urlsafe_b64decode(signature_b64 + '==')

        expected_signature = hmac.new(secret_bytes, message, hashlib.sha256).digest()

        if hmac.compare_digest(signature, expected_signature):
            return payload
        else:
            raise ValueError("Invalid signature")
    except Exception as e:
        raise ValueError(f"Decoding JWT: {e}")


def encode_jwt(payload: Dict[str, Any], secret: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).rstrip(b'=').decode()
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
    message = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(secret.encode(), message, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).rstrip(b'=').decode()
    return f"{header_b64}.{payload_b64}.{signature_b64}"