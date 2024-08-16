import os
from product_horse.db import setup_production_db
from product_horse.search import setup_vector_db
from storage_client.wrapper import StorageClient
import tempfile
import base64
import json
import hmac
import hashlib
from typing import Dict, Any
from datetime import datetime, timedelta
import shutil
import subprocess

# Get database URLs
DATABASE_SUPERUSER_URL = os.getenv("DATABASE_SUPERUSER_URL")
DATABASE_URL = os.getenv("DATABASE_URL")
RLS_USER_PASSWORD = os.getenv("RLS_USER_PASSWORD")
SECRET = os.getenv("SECRET")

if not all([DATABASE_SUPERUSER_URL, DATABASE_URL, RLS_USER_PASSWORD, SECRET]):
    raise ValueError("Missing required environment variables")

# jwt
def encode_jwt(payload: Dict[str, Any], secret: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).rstrip(b'=').decode()
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
    message = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(secret.encode(), message, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).rstrip(b'=').decode()
    return f"{header_b64}.{payload_b64}.{signature_b64}"


JWT = encode_jwt(
    payload={
        "id": "test",
        "company_id": "test",
        "exp": (datetime.utcnow() + timedelta(days=1)).timestamp(),
        "permission_level": 3,
    },
    secret=SECRET,
)

def setup_environment(load_data: bool = False):
    try:
        rls_database_url = setup_production_db(DATABASE_SUPERUSER_URL) # type: ignore
        vector_db_url = setup_vector_db(DATABASE_SUPERUSER_URL)
    except Exception as e:
        print(f"Error setting up environment: {e}")
        raise e

    with tempfile.TemporaryDirectory() as tmpdir:
        if load_data:
            client = StorageClient(base_url="https://storage.producthorse.workers.dev/", jwt=JWT)
            db_data = client.download_file("integration-text-data.sql")
            vector_db_backup = client.download_file("vector_db_backup.sql")
            with open(os.path.join(tmpdir, "integration-text-data.sql"), "wb") as f:
                shutil.copyfileobj(db_data, f)
            with open(os.path.join(tmpdir, "vector_db_backup.sql"), "wb") as f:
                shutil.copyfileobj(vector_db_backup, f)
            subprocess.run(["psql", "-d", DATABASE_URL, "-f", os.path.join(tmpdir, "integration-text-data.sql")]) # type: ignore
            subprocess.run(["psql", "-d", vector_db_url, "-f", os.path.join(tmpdir, "vector_db_backup.sql")]) # type: ignore
    print("Environment setup complete!")
    print(f"RLS Database URL: {rls_database_url}")
    print(f"Regular Database URL: {DATABASE_URL}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--load-data", action="store_true", help="Load data during setup")
    args = parser.parse_args()
    setup_environment(load_data=args.load_data)