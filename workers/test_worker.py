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
import io
from uuid import uuid4

load_dotenv()


def encode_jwt(payload: Dict[str, Any], secret: str) -> str:
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
        key = str(uuid4())
        files = {
            'file': ('test.txt', io.BytesIO(b'example content'), 'text/plain'),
        }
        data = {
            'key': key,
            'visibility': 'PUBLIC',
        }
        response = requests.put(
            f"{self.BASE_URL}/files", headers=self.HEADERS, files=files, data=data
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("size", response.json())

    def test_put_and_get_file(self):
        key_to_test = str(uuid4())
        files = {
            'file': ('test.txt', io.BytesIO(b'example content'), 'text/plain'),
        }
        data = {
            'key': key_to_test,
            'visibility': 'PUBLIC',
        }
        success_put = requests.put(
            f"{self.BASE_URL}/files", headers=self.HEADERS, files=files, data=data
        )
        self.assertEqual(success_put.status_code, 200)
        response = requests.get(
            f"{self.BASE_URL}/files",
            headers=self.HEADERS,
            params={"key": key_to_test},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Content-Disposition'], f'filename="{key_to_test}"')
        self.assertEqual(response.content, b'example content')

    def test_get_file_with_options(self):
        """Check that the limit works"""
        response = requests.get(
            f"{self.BASE_URL}/files", headers=self.HEADERS, params={"limit": 2}
        )
        self.assertEqual(response.status_code, 206)
        self.assertIsInstance(response.json()["objects"], list)
        self.assertEqual(len(response.json()["objects"]), 2)

    def test_get_file_with_signed_url(self):
        """Check that I can get a public signed url for a file"""
        key_to_test = str(uuid4())
        files = {
            'file': (f'{key_to_test}.txt', io.BytesIO(b'example content'), 'text/plain'),
        }
        data = {
            'key': f'{key_to_test}.txt',
            'visibility': 'PUBLIC',
        }
        setup_by_putting_file = requests.put(
            f"{self.BASE_URL}/files", headers=self.HEADERS, files=files, data=data
        )
        self.assertEqual(setup_by_putting_file.status_code, 200)
        response = requests.get(
            f"{self.BASE_URL}/download/{key_to_test}.txt/token", headers=self.HEADERS
        )
        self.assertEqual(response.status_code, 200, f"token creation status code should be 200, got {response.json()}")
        self.assertIsInstance(response.json()["token"], str)
        one_time_use = requests.get(
            f"{self.BASE_URL}/download/{key_to_test}.txt", headers=self.HEADERS,
            params={"token": response.json()["token"]}
        )
        print(one_time_use.content)
        self.assertEqual(one_time_use.status_code, 200)
        self.assertEqual(one_time_use.content, b'example content')
        # Check that the signed url is invalid after one use
        one_time_use_b = requests.get(
            f"{self.BASE_URL}/download/{key_to_test}.txt", headers=self.HEADERS,
            params={"token": response.json()["token"]}
        )
        self.assertEqual(one_time_use_b.status_code, 400)

    def test_multi_part_upload_e2e(self):
        key_to_test = str(uuid4())
        data = {"key": key_to_test, "visibility": "PUBLIC"}
        response = requests.post(
            f"{self.BASE_URL}/files", headers=self.HEADERS, json=data
        )
        multi_part_upload_response = response.json()
        self.assertEqual(
            response.status_code,
            200,
            f"Response status code should be 200, got {multi_part_upload_response}",
        )
        self.assertIn("key", multi_part_upload_response)
        self.assertIn("uploadId", multi_part_upload_response)
        upload_id = multi_part_upload_response["uploadId"]

        files = {
            'file': ('part1.txt', io.BytesIO(b'example content'), 'text/plain'),
        }
        data = {
            "key": key_to_test,
            "upload_id": upload_id,
            "part": 1,
        }
        multi_part_file_data = requests.put(
            f"{self.BASE_URL}/files", headers=self.HEADERS, files=files, data=data
        )
        self.assertEqual(multi_part_file_data.status_code, 201)
        self.assertIn("etag", multi_part_file_data.json())
        self.assertIn("partNumber", multi_part_file_data.json())

        final_response = requests.post(
            f"{self.BASE_URL}/files",
            headers=self.HEADERS,
            json=[multi_part_file_data.json()],
            params={"upload_id": upload_id, "key": key_to_test, "visibility": "PUBLIC"},
        )
        self.assertEqual(
            final_response.status_code,
            200,
            f"Response status code should be 200, got {final_response.json()}",
        )
        self.assertIn("etag", final_response.json(), "etag should be in the response")

    def test_file_isolation(self):
        # Create second credential
        second_headers = {
            "X-API-Key": encode_jwt(
                payload={
                    "id": "test2",
                    "company_id": "test2",
                    "exp": (datetime.utcnow() + timedelta(days=1)).timestamp(),
                    "permission_level": 3,
                },
                secret=os.getenv("SECRET") or "",
            )
        }

        # Upload file with second credential
        key = str(uuid4())
        data = {
            "key": key,
            "visibility": "PRIVATE",
        }
        files = {
            'file': ('test.txt', io.BytesIO(b'example content'), 'text/plain'),
        }
        response = requests.put(
            f"{self.BASE_URL}/files", headers=second_headers, files=files, data=data
        )
        self.assertEqual(response.status_code, 200)
        data = {
            "key": key + "2",
            "visibility": "PUBLIC",
        }
        files = {
            'file': ('test.txt', io.BytesIO(b'example content'), 'text/plain'),
        }
        response = requests.put(
            f"{self.BASE_URL}/files", headers=second_headers, files=files, data=data
        )
        self.assertEqual(response.status_code, 200)

        # List files with second credential
        list_response = requests.get(
            f"{self.BASE_URL}/files", headers=second_headers, params={"limit": 4}
        )
        self.assertEqual(list_response.status_code, 206)
        files = list_response.json()["objects"]
        self.assertEqual(len(files), 2)
        self.assertEqual(files[0]["key"], key)
        # assert that the second file is not in the list
        self.assertNotEqual(files[1]["key"], key)

    def test_missing_api_key(self):
        response = requests.get(f"{self.BASE_URL}/files", params={"limit": 1})
        self.assertEqual(response.status_code, 401)

    def test_invalid_jwt(self):
        headers = {"X-API-Key": "invalid_jwt"}
        response = requests.get(
            f"{self.BASE_URL}/files", headers=headers, params={"limit": 1}
        )
        self.assertEqual(response.status_code, 401)

    def test_invalid_url_path(self):
        response = requests.get(f"{self.BASE_URL}/invalid", headers=self.HEADERS)
        self.assertEqual(response.status_code, 404)

    def test_get_without_params(self):
        response = requests.get(f"{self.BASE_URL}/files", headers=self.HEADERS)
        self.assertEqual(response.status_code, 400)

    def test_get_nonexistent_file(self):
        response = requests.get(
            f"{self.BASE_URL}/files",
            headers=self.HEADERS,
            params={"key": "nonexistent"},
        )
        self.assertEqual(response.status_code, 404)

    def test_put_invalid_body(self):
        data = {"invalid": "data"}
        response = requests.put(
            f"{self.BASE_URL}/files", headers=self.HEADERS, json=data
        )
        self.assertEqual(response.status_code, 400)

    def test_put_non_multipart(self):
        data = {
            "key": str(uuid4()),
            "visibility": "PUBLIC",
            "content": "example content",
        }
        response = requests.put(
            f"{self.BASE_URL}/files", headers=self.HEADERS, json=data
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())
        self.assertEqual(response.json()["error"], "Multipart form-data required")

    def test_unsupported_method(self):
        response = requests.patch(f"{self.BASE_URL}/files", headers=self.HEADERS)
        self.assertEqual(response.status_code, 405)

    def test_delete_method(self):
        response = requests.delete(f"{self.BASE_URL}/files", headers=self.HEADERS)
        self.assertEqual(response.status_code, 501)  # Not Implemented


if __name__ == "__main__":
    unittest.main(exit=False)
    r2_dir = os.environ["R2_DIR"]
    if r2_dir and r2_dir[-1] == "/":
        os.system(f"rm -rf {r2_dir}*")
