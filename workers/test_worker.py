import unittest
from dataclasses import dataclass
import requests
from dotenv import load_dotenv
import base64
import json
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any
import os

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


@dataclass
class UploadState:
    upload_id: str
    part: int


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

    def setUp(self):
        self.upload_state = UploadState(upload_id="", part=1)

    def test_put_file(self):
        data = {"key": "test", "visibility": "PUBLIC", "content": "example content"}
        response = requests.put(
            f"{self.BASE_URL}/files", headers=self.HEADERS, json=data
        )
        # print('put',response.json())
        self.assertEqual(response.status_code, 200)
        self.assertIn("size", response.json())

    def test_get_file(self):
        # get without options
        response = requests.get(
            f"{self.BASE_URL}/files", headers=self.HEADERS, params={"key": "test"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("key", response.json())

    def test_get_file_with_options(self):
        response = requests.get(
            f"{self.BASE_URL}/files", headers=self.HEADERS, params={"limit": 1}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json()["objects"], list)
        self.assertEqual(len(response.json()["objects"]), 1)

    def test_multi_part_upload_e2e(self):
        data = {"key": "test", "visibility": "PUBLIC"}
        response = requests.post(
            f"{self.BASE_URL}/files", headers=self.HEADERS, json=data
        )
        multi_part_upload_response = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("key", multi_part_upload_response)
        self.assertIn("uploadId", multi_part_upload_response)
        upload_id = multi_part_upload_response["uploadId"]

        print("send a file part")
        data = {
            "key": "test",
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

        response = requests.post(
            f"{self.BASE_URL}/files",
            headers=self.HEADERS,
            json=[multi_part_file_data.json()],
            params={"upload_id": upload_id, 'key': 'test'},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("etag", response.json())


if __name__ == "__main__":
    unittest.main()
