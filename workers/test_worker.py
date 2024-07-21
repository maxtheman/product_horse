import unittest
import requests
from dotenv import load_dotenv
import base64
import json
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any
import os
from uuid import uuid4

load_dotenv()


def encode_jwt(payload: Dict[str, Any], secret: str) -> str:
    """copy/pasted from jwt workers file"""
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = (
        base64.urlsafe_b64encode(json.dumps(header).encode()).rstrip(b"=").decode()
    )
    payload_b64 = (
        base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    )
    message = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(secret.encode(), message, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).rstrip(b"=").decode()
    return f"{header_b64}.{payload_b64}.{signature_b64}"


class TestAPI(unittest.TestCase):
    BASE_URL = "http://localhost:8787"
    HEADERS = {
        "X-API-Key": encode_jwt(
            payload={
                "id": "test",
                "company_id": "test",
                "exp": (datetime.utcnow() + timedelta(days=1)).timestamp(),
                "permission_level": 3,
            },
            secret=os.getenv("SECRET") or "",
        )
    }

    def test_put_file(self):
        key_to_test = str(uuid4())
        data = {"key": key_to_test, "visibility": "PUBLIC", "content": "example content"}
        response = requests.put(
            f"{self.BASE_URL}/files", headers=self.HEADERS, json=data
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("size", response.json())

    def test_get_file(self):
        # get without options
        HARDCODED_KEY = "test"
        response = requests.get(
            f"{self.BASE_URL}/files", headers=self.HEADERS, params={"key": HARDCODED_KEY}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("key", response.json())

    def test_get_file_with_options(self):
        """Check that the limit works"""
        response = requests.get(
            f"{self.BASE_URL}/files", headers=self.HEADERS, params={"limit": 2}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json()["objects"], list)
        self.assertEqual(len(response.json()["objects"]), 2)

    def test_multi_part_upload_e2e(self):
        key_to_test = str(uuid4())
        data = {"key": key_to_test, "visibility": "PUBLIC"}
        response = requests.post(
            f"{self.BASE_URL}/files", headers=self.HEADERS, json=data
        )
        multi_part_upload_response = response.json()
        self.assertEqual(response.status_code, 200, f"Response status code should be 200, got {multi_part_upload_response}")
        self.assertIn("key", multi_part_upload_response)
        self.assertIn("uploadId", multi_part_upload_response)
        upload_id = multi_part_upload_response["uploadId"]

        data = {
            "key": key_to_test,
            "upload_id": upload_id,
            "part": 1,
            "content": "example content",
        }
        multi_part_file_data = requests.put(
            f"{self.BASE_URL}/files", headers=self.HEADERS, json=data
        )
        self.assertEqual(multi_part_file_data.status_code, 200)
        self.assertIn("etag", multi_part_file_data.json())
        self.assertIn("partNumber", multi_part_file_data.json())

        final_response = requests.post(
            f"{self.BASE_URL}/files",
            headers=self.HEADERS,
            json=[multi_part_file_data.json()],
            params={"upload_id": upload_id, 'key': key_to_test, 'visibility': 'PUBLIC'},
        )
        self.assertEqual(final_response.status_code, 200, f"Response status code should be 200, got {final_response.json()}")
        self.assertIn("etag", final_response.json(), "etag should be in the response")


if __name__ == "__main__":
    unittest.main()
