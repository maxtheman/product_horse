from storage_client.src import AuthenticatedClient
from storage_client.src.api.default import put_files, get_files, post_files
from storage_client.src.models import (
    PutFilesBody,
    Visibility,
    FileCreateStartBody,
    R2MultipartUploadResponse,
    R2UploadedPartBody,
    R2UploadedPart,
)
from storage_client.src.types import File
import base64
import json
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, AsyncGenerator
from rich.console import Console
import io

import os
from dotenv import load_dotenv
from uuid import uuid4
import asyncio

load_dotenv()

console = Console()

test_key = str(uuid4())
test_key_2 = str(uuid4())

MAX_PART_SIZE = 10 * 1024 * 1024


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


JWT = encode_jwt(
    payload={
        "id": "test",
        "company_id": "test",
        "exp": (datetime.utcnow() + timedelta(days=1)).timestamp(),
        "permission_level": 3,
    },
    secret=os.getenv("SECRET") or "",
)

# NOVEL CODE


async def chunk_reader(
    file_object: io.BufferedReader, chunk_size: int
) -> AsyncGenerator[bytes, Any]:
    while True:
        chunk = file_object.read(chunk_size)
        if not chunk:
            break
        yield chunk


TEST_LOCAL_FILE = (
    # "/Users/max/Documents/product_horse/static_files/temp-videos/How_do_you_think_about_what_the_Value_of_Pave_is_t.mp4"
    "/Users/max/Documents/product_horse/static_files/temp-videos/test-viz.mp4"
)

client = AuthenticatedClient(
    # base_url="https://storage.producthorse.workers.dev/",
    base_url="http://localhost:8787",
    token=JWT,
    # verify_ssl=False,
)

file_object = open(TEST_LOCAL_FILE, "rb")
body = PutFilesBody(
    key=test_key,
    file=File(
        payload=file_object,
        file_name=os.path.basename(TEST_LOCAL_FILE),
        mime_type="video/mp4",
    ),
    visibility=Visibility.PUBLIC,
)

file_uploaded = put_files.sync(client=client, body=body)

files_got = get_files.sync_detailed(client=client, limit=1)

get_specific_file = get_files.sync(client=client, key=test_key)

start_multi_part_upload = post_files.sync(
    client=client, body=FileCreateStartBody(key=test_key_2, visibility=Visibility.PUBLIC)
)
if not isinstance(start_multi_part_upload, R2MultipartUploadResponse):
    print(start_multi_part_upload)
    raise Exception("No upload id returned")

upload_file_part = put_files.sync(
    client=client,
    body=PutFilesBody(
        key=test_key_2,
        upload_id=start_multi_part_upload.upload_id,
        part=1,
        file=File(
            payload=file_object,
            file_name=os.path.basename(TEST_LOCAL_FILE),
            mime_type="video/mp4",
        ),
    ),
)

if not isinstance(upload_file_part, R2UploadedPart):
    print(upload_file_part)
    raise Exception("No part returned")

end_multi_part_upload = post_files.sync_detailed(
    client=client,
    key=test_key_2,
    upload_id=start_multi_part_upload.upload_id,
    body=[
        R2UploadedPartBody(
            etag=upload_file_part.etag, part_number=upload_file_part.part_number
        )
    ],
    visibility=Visibility.INTERNAL,
)

### big file test ###
# big_file_start = post_files.sync(
#     client=client,
#     body=FileCreateStartBody(key=test_key_2, visibility=Visibility.PRIVATE),
# )

# if not isinstance(big_file_start, R2MultipartUploadResponse):
#     raise Exception("No upload id returned")


# async def upload_big_file():
#     async def upload_chunk(chunk: bytes, part_number: int):
#         upload_file_part = await put_files.asyncio(
#             client=client,
#             body=PutFilesBody(
#                 key=test_key_2,
#                 upload_id=big_file_start.upload_id,
#                 part=part_number,
#                 file=File(
#                     payload=io.BytesIO(chunk),
#                     file_name=os.path.basename(TEST_LOCAL_FILE),
#                     mime_type="video/mp4",
#                 ),
#             ),
#         )
#         if not isinstance(upload_file_part, R2UploadedPart):
#             print(upload_file_part)
#             raise Exception(f"No part returned for part {part_number}")
#         return R2UploadedPartBody(
#             etag=upload_file_part.etag, part_number=upload_file_part.part_number
#         )

#     chunks = [chunk async for chunk in chunk_reader(file_object, MAX_PART_SIZE)]
#     parts = await asyncio.gather(*[upload_chunk(chunk, i+1) for i, chunk in enumerate(chunks)])
#     return parts

# parts = asyncio.run(upload_big_file())

# end_big_multi_part_upload = post_files.sync(
#     client=client,
#     key=test_key_2,
#     upload_id=big_file_start.upload_id,
#     body=parts,
#     visibility=Visibility.PRIVATE,
# )

# get_big_file = get_files.sync_detailed(client=client, key=test_key_2)

file_object.close()

if __name__ == "__main__":
    console.print(file_uploaded)
    console.print(files_got)
    console.print("body", files_got)
    if isinstance(get_specific_file, File):
        with open("./static_files/downloaded_file.mp4", "wb") as f:
            f.write(get_specific_file.payload.read())
    console.print(start_multi_part_upload)
    console.print(upload_file_part)
    console.print(end_multi_part_upload)
    # console.print(get_big_file)
