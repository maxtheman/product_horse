import asyncio
import io
from dataclasses import dataclass
from typing import Any, BinaryIO, Coroutine, Dict, List, Union, cast
from urllib.parse import quote

from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential
from tenacity.asyncio import AsyncRetrying

from storage_client.src import AuthenticatedClient
from storage_client.src.api.default import get_download_file_key_token, get_files, post_files, put_files
from storage_client.src.models import (
    FileCreateStartBody,
    GetDownloadFileKeyTokenResponse200,
    PutFilesBody,
    R2MultipartUploadResponse,
    R2Object,
    R2ObjectList,
    R2UploadedPartBody,
)
from storage_client.src.models import (
    Visibility as APIVisibility,
)
from storage_client.src.types import File, Unset

"""
Example usage:

from storage_client import StorageClient

# Initialize client
client = StorageClient(base_url="https://api.example.com", jwt="your_jwt_token")

# Upload file
with open("example.txt", "rb") as f:
    result = client.upload_file(f, "example.txt", "public")

# Download file
file_data = client.download_file("example.txt")

# Get file metadata
metadata = client.get_file_metadata("example.txt")

# List files
files = client.list_files(limit=10)
"""

MAX_PART_SIZE = 10 * 1024 * 1024
MAX_CONCURRENT_UPLOADS = 6
MAX_RETRIES = 3
RETRY_MIN_WAIT = 1  # Minimum wait time between retries in seconds
RETRY_MAX_WAIT = 10


@dataclass
class StorageClient:
    base_url: str
    jwt: str

    def __post_init__(self):
        self.client = AuthenticatedClient(base_url=self.base_url, token=self.jwt)

    @staticmethod
    def _parse_visibility(visibility: Union[str, APIVisibility]) -> APIVisibility:
        if isinstance(visibility, APIVisibility):
            return visibility
        try:
            return APIVisibility[visibility.upper()]
        except KeyError:
            raise ValueError(f"Invalid visibility: {visibility}. Must be one of {', '.join(APIVisibility.__members__)}")

    async def upload_file(self, file: io.BytesIO, key: str, visibility: Union[str, APIVisibility], mime_type: str):
        """
        Upload a file, automatically choosing between small and large file upload methods.

        Args:
            file (BinaryIO): The file-like object to upload.
            key (str): The key (path) to store the file under.
            visibility (Visibility): The visibility setting for the file.

        Returns:
            File: The uploaded file object.
        """
        if key.startswith('/'):
            raise Exception("Key cannot start with a slash")
        parsed_visibility = self._parse_visibility(visibility)
        file.seek(0, io.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        file_to_return = None

        if file_size <= MAX_PART_SIZE:
            file_to_return = self._upload_small_file(file, key, parsed_visibility, mime_type)
            if file_to_return.status_code != 200:
                raise Exception(f"Failed to upload small file: {file_to_return}")
        else:
            file_to_return = await self._upload_large_file(file, key, parsed_visibility, mime_type)
        return file_to_return

    def _upload_small_file(self, file: io.BytesIO, key: str, visibility: APIVisibility, mime_type: str):
        """
        Internal method to upload a small file.

        Args:
            file (BinaryIO): The file-like object to upload.
            key (str): The key (path) to store the file under.
            visibility (Visibility): The visibility setting for the file.

        Returns:
            File: The uploaded file object.
        """
        body = PutFilesBody(
            key=key,
            file=File(payload=file, file_name=key, mime_type=mime_type),
            visibility=visibility,
        )
        return put_files.sync_detailed(client=self.client, body=body)

    async def _upload_large_file(self, file: io.BytesIO, key: str, visibility: APIVisibility, mime_type: str):
        """
        Internal method to upload a large file using multipart upload.

        Args:
            file (io.BytesIO): The file-like object to upload.
            key (str): The key (path) to store the file under.
            visibility (Visibility): The visibility setting for the file.

        Returns:
            File: The uploaded file object.
        """
        start_response = post_files.sync_detailed(
            client=self.client, body=FileCreateStartBody(key=key, visibility=visibility)
        )
        if not isinstance(start_response.parsed, R2MultipartUploadResponse):
            raise Exception("Failed to start multipart upload")

        upload_id = start_response.parsed.upload_id
        parts: List[R2UploadedPartBody] = []

        @retry(
            stop=stop_after_attempt(MAX_RETRIES),
            wait=wait_exponential(multiplier=1, min=RETRY_MIN_WAIT, max=RETRY_MAX_WAIT),
            retry=retry_if_exception_type((Exception,)),
            reraise=True,
        )
        async def upload_part(part_number: int, chunk: bytes):
            try:
                retry_config = AsyncRetrying(
                    stop=stop_after_attempt(MAX_RETRIES),
                    wait=wait_exponential(multiplier=1, min=RETRY_MIN_WAIT, max=RETRY_MAX_WAIT),
                    retry=retry_if_exception_type(IOError),
                    reraise=True
                )
                async for attempt in retry_config:
                    with attempt:
                        body_to_send = PutFilesBody(
                            key=key,
                            upload_id=upload_id,
                            part=part_number,
                            file=File(payload=chunk, file_name=key, mime_type=mime_type),  # type: ignore
                            visibility=visibility,
                        )  # type: ignore
                        part_response = await put_files.asyncio_detailed(
                            client=self.client,
                            body=body_to_send,
                        )
                        if part_response.status_code == 400:
                            print(f"Bad request: {part_response.content.decode('utf-8')}")
                            raise Exception(f"Bad request: {part_response.content.decode('utf-8')}")
                        if part_response.status_code == 500:
                            raise IOError(f"Failed to upload part {part_response} - Cloudflare error again :-/)") #hacky way to retry only on 500 errors.
                        if not hasattr(part_response.parsed, "etag"):
                            raise Exception(f"Failed to upload part {part_response}")
                        if part_response.parsed is None:
                            raise Exception(f"Failed to upload part {part_response}")
                        body = R2UploadedPartBody(
                            etag=part_response.parsed.etag,  # type: ignore
                            part_number=part_number,
                        )  # type: ignore
                        return body
            except Exception as e:
                print(f"Error uploading part {part_number}: {e}")
                raise e

        semaphore = asyncio.Semaphore(MAX_CONCURRENT_UPLOADS)

        async def upload_part_with_semaphore(part_number: int, chunk: bytes) -> R2UploadedPartBody:
            async with semaphore:
                part = await upload_part(part_number, chunk)
                if part is None:
                    raise Exception(f"Failed to upload part {part_number}")
                return part

        part_number = 1
        upload_tasks: List[Coroutine[Any, Any, R2UploadedPartBody]] = []
        while True:
            chunk = file.read(MAX_PART_SIZE)
            if not chunk:
                break
            upload_tasks.append(upload_part_with_semaphore(part_number, chunk))
            part_number += 1
        parts = await asyncio.gather(*upload_tasks)

        complete_response = post_files.sync_detailed(
            client=self.client,
            key=key,
            upload_id=upload_id,
            body=parts,
            visibility=visibility,
        )
        return complete_response.parsed

    def download_file(self, key: str) -> BinaryIO:
        """
        Download a file.

        Args:
            key (str): The key (path) of the file to download.

        Returns:
            BinaryIO: A file-like object containing the downloaded file data.
        """
        response = get_files.sync(client=self.client, key=key)
        if isinstance(response, File):
            return response.payload
        raise Exception(f"Failed to download file: {key}")

    def get_signed_url(self, key: str) -> str:
        """
        Get a signed URL for a file.

        Args:
            key (str): The key (path) of the file.

        Returns:
            str: A signed URL for the file.
        """
        response = get_download_file_key_token.sync(client=self.client, file_key=key)
        if isinstance(response, GetDownloadFileKeyTokenResponse200):
            token = response.token
            if isinstance(token, str):
                encoded_key = quote(key)
                encoded_token = quote(token.encode('utf-8'))
                return f"{self.base_url}download/{encoded_key}?token={encoded_token}"
            else:
                raise Exception(f"Failed to get signed URL for file: {key}")
        raise Exception(f"Failed to get signed URL for file: {key}")

    def get_file_metadata(self, key: str) -> Dict[str, Any]:
        """
        Retrieve metadata for a specific file.

        Args:
            key (str): The key (path) of the file.

        Returns:
            Dict[str, Any]: A dictionary containing the file's metadata. Raises an exception if the file is not found.
        """
        response: Any | File | R2Object | R2ObjectList | None = get_files.sync(client=self.client, key=key)
        if isinstance(response, File):
            return {
                "payload": response.payload,
                "filename": response.file_name,
                "mime_type": response.mime_type,
            }
        raise Exception(f"Failed to get file metadata: {key}")

    def list_files(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        List files in the storage.

        Args:
            limit (int, optional): The maximum number of files to list. Defaults to 100.

        Returns:
            List[Dict[str, Any]]: A list of dictionaries, each containing file metadata.
        """
        response = get_files.sync(client=self.client, limit=limit)
        if isinstance(response, list):
            return [
                {
                    "key": file.key,
                    "size": file.size,
                    "etag": file.etag,
                    "http_etage": file.http_etag,
                    "uploaded": file.uploaded,
                }
                for file in cast(List[R2Object], response)
            ]
        raise Exception("Failed to list files")
