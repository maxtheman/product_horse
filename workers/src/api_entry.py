# type: ignore
from js import Response, console, ReadableStream, Object, Headers
from base64 import b64encode
from jwt import decode_jwt
from cf_types import (
    Method,
    Env,
    WorkerRequestType,
    JwtPayload,
    D1Database,
    R2ListOptions,
    FileCreate,
    FileCreatePart,
    FileId,
    R2Object,
    R2ObjectBody,
    R2Bucket,
    Employee,
    R2UploadedPart,
    Visibility,
    R2MultipartUpload,
    FileAccess,
)
from db_ops import (
    check_and_insert_employee,
    insert_file_access,
    check_file_access,
    get_employee,
    check_multiple_file_access,
)
from typing import Optional, Any
from enum import Enum
from datetime import datetime
from dataclasses import field, dataclass, asdict
from pyodide.ffi import JsException, to_js as _to_js
from urllib.parse import urlparse, parse_qs, unquote
import json
import uuid
import time


class DataSize(Enum):
    MB_100 = 100 * 1024 * 1024
    MB_1000 = 1000 * 1024 * 1024


def to_js(obj):
    return _to_js(obj, dict_converter=Object.fromEntries)


def get_body(value, convert, cache):
    if value.constructor.name == "GetResult":
        return value.body
    else:
        pass


async def generate_signed_url_token(
    env: Env, file_key, employee_id, company_id, expiration_seconds=300
):
    token = str(uuid.uuid4())
    expiration = int(time.time()) + expiration_seconds
    value = f"{expiration}|{file_key}|{employee_id}|{company_id}"
    await env.SIGNED_URL_KEYS.put(token, value)
    test_get = await env.SIGNED_URL_KEYS.get(token)
    if not test_get:
        raise ValueError("Failed to generate signed URL token")
    return token


async def validate_signed_url(env: Env, token):
    value = await env.SIGNED_URL_KEYS.get(token)
    if not value:
        return None

    expiration, file_key, employee_id, company_id = value.split("|", 3)
    employee = await get_employee(env.DB, employee_id, company_id)
    if int(time.time()) > int(expiration):
        print("Token expired")
        await env.SIGNED_URL_KEYS.delete(token)
        return None

    await env.SIGNED_URL_KEYS.delete(token)
    return file_key, employee


def r2object_converter(value, convert, cache):
    if value.constructor.name == "HeadResult":
        customMetadata = {}
        httpEtag = ""
        httpMetadata = {}
        if value.customMetadata:
            customMetadata = value.customMetadata.to_py()
        if value.httpEtag:
            httpEtag = value.httpEtag
        if value.httpMetadata:
            httpMetadata = value.httpMetadata.to_py()
        if value.checksums.md5:
            checksum = value.checksums.md5.to_bytes().hex()
        else:
            checksum = ""
        r2_object = R2Object(
            storageClass=value.storageClass,
            key=value.key,
            etag=value.etag,
            size=value.size,
            uploaded=value.uploaded.toGMTString(),
            checksums={"md5": checksum},
            httpEtag=httpEtag,
            customMetadata=customMetadata,
            httpMetadata=httpMetadata,
            version=value.version,
            range=value.range,
        )
        return r2_object
    return value


class File:
    lastModified: int
    name: str
    size: int
    type: str

    async def arrayBuffer(self): ...

    async def stream(self) -> ReadableStream: ...


class MultipartData:
    file: File
    metadata: dict[str, Any]


async def parse_multipart_data(request):
    form = await request.formData()
    metadata_keys = [key for key in form.keys() if key != "file"]
    metadata = {key: form.get(key) for key in metadata_keys}
    file = form.get("file")
    return file, metadata


# CORE WORKER
# can't connect with hyperdrive due to rls - hyperdrive doesn't support SET.
async def authenticate_employee(jwt, env: Env):
    payload: JwtPayload = decode_jwt(jwt, env.SECRET)
    assert payload["id"] is not None
    assert payload["company_id"] is not None
    assert datetime.fromtimestamp(payload["exp"]) > datetime.now()
    assert payload["permission_level"] is not None
    employee_args = payload.copy()
    employee_args.pop("exp")
    employee = Employee(**employee_args)
    return employee


async def stream_to_json(stream: ReadableStream) -> dict[str, Any]:
    body_chunks = []
    async for chunk in stream:
        body_chunks.append(chunk.to_py())
    body_bytes = b"".join(body_chunks)
    body_str = body_bytes.decode("utf-8")
    return json.loads(body_str)


async def base64_encode(data: bytes) -> str:
    return b64encode(data).decode("utf-8")


@dataclass
class GetOptions:
    onlyIf: dict[str, Any]
    range: dict[str, Any]


@dataclass
class ListOptions:
    limit: int
    _limit: Optional[int] = field(default=100, init=False)
    cursor: Optional[str] = field(default=None)

    @property
    def limit(self):
        return self._limit

    @limit.setter
    def limit(self, value: int):
        if not isinstance(value, int):
            raise ValueError("Limit must be an integer")
        if value < 1 or value > 1000:
            raise ValueError("Limit must be between 1 and 1000")
        self._limit = value


def sanitize_string(s: str) -> str:
    return s.replace(" ", "_").strip("/")


def get_url_path_and_params(url: str) -> tuple[str, dict[str, str]]:
    parsed_url = urlparse(url)
    url_path = unquote(parsed_url.path).strip("/")
    params = {
        k: sanitize_string(unquote(v[0])) for k, v in parse_qs(parsed_url.query).items()
    }
    if url_path.startswith("download/") and url_path.endswith("/token"):
        file_path = "/".join(url_path.split("/")[1:-1])  # Exclude 'download' and 'token'
        params["file_name"] = file_path
        url_path = "download"
    elif url_path.startswith("download/"):
        file_path = "/".join(url_path.split("/")[1:])  # Exclude 'download'
        params["file_name"] = file_path
        url_path = "download"
    return url_path, params


async def get_file(
    key: str | None,
    employee: Employee,
    bucket: R2Bucket,
    d1: D1Database,
    options: GetOptions | R2ListOptions | None,
):
    # Check file access?
    if options is None and key is not None:
        object: R2Object | R2ObjectBody = await bucket.get(key)
        return object
    decoded_options: dict[str, Any] = asdict(options)
    if "limit" in decoded_options or "cursor" in decoded_options:
        # LIST PATH
        final_options_dict = {
            "limit": decoded_options.get("limit", 100),
            "cursor": decoded_options.get("cursor", None),
        }
        objects = await bucket.list(**final_options_dict)
        objects = objects.to_py(default_converter=r2object_converter)
        if len(objects["objects"]) == 0:
            raise FileNotFoundError("No objects found")
        file_accesses = await check_multiple_file_access(
            d1, [obj.key for obj in objects["objects"]], employee
        )
        filtered_dict = {"objects": []}
        for item in objects["objects"]:
            item_dict = asdict(item)
            name = item_dict["key"]
            if name in file_accesses:
                result = next(
                    (asdict(item) for item in objects["objects"] if name <= item.key),
                    None,
                )
                filtered_dict["objects"].append(result)
        return to_js(filtered_dict)
    elif key is not None and (
        "range" in decoded_options or "onlyIf" in decoded_options
    ):
        file_access = await check_file_access(d1, key, employee)
        if not file_access:
            raise PermissionError("File access denied")
        object: R2Object | R2ObjectBody = await bucket.get(key, options=decoded_options)
    else:
        raise ValueError("Invalid request")
    if "body" not in object:
        raise ValueError("Invalid object - options failed")
    elif "body" in object:
        return object
    else:
        raise ValueError("Invalid object - options failed")


def content_validator(content: str | bytes):
    if content is None or content == "" or len(content) < 2:
        raise ValueError("Content is required")


@dataclass
class FileCreateBody:
    key: str
    _content: str | bytes = field(init=False)
    _visibility: Visibility = field(default=Visibility.PUBLIC, init=False)
    content: str | bytes
    visibility: Visibility

    @property
    def visibility(self):
        return self._visibility

    @visibility.setter
    def visibility(self, value: Visibility):
        if value not in Visibility:
            raise ValueError("Invalid visibility")
        self._visibility = value

    @property
    def content(self):
        return self._content

    @content.setter
    def content(self, value: str | bytes):
        content_validator(value)
        self._content = value


@dataclass
class FileCreatePartBody:
    _content: str | bytes = field(init=False)
    _part: int = field(init=False)
    key: str
    upload_id: str
    _upload_id: str = field(init=False)
    part: int
    content: str | bytes

    @property
    def part(self):
        return self._part

    @property
    def content(self):
        return self._content

    @property
    def upload_id(self):
        return str(self._upload_id)

    @content.setter
    def content(self, value: str | bytes):
        content_validator(value)
        self._content = value

    @part.setter
    def part(self, value: int):
        if not isinstance(value, int):
            raise ValueError("Part must be an integer")
        if value < 0 or value > 1000000:
            raise ValueError("Invalid part number")
        self._part = value

    @upload_id.setter
    def upload_id(self, value: str):
        if not isinstance(value, str):
            self._upload_id = str(value)
        else:
            self._upload_id = value


def file_create_factory(file_body: dict[str, Any]):
    if "upload_id" in file_body:
        return FileCreatePartBody(**file_body)
    return FileCreateBody(**file_body)


@dataclass
class R2UploadedPartBody(R2UploadedPart):
    etag: str
    partNumber: int
    _part_number: int = field(init=False)

    @property
    def part_number(self):
        return self._part_number

    @property
    def partNumber(self):
        return self._part_number

    @partNumber.setter
    def partNumber(self, value: int):
        if not isinstance(value, int):
            raise ValueError("Part number must be an integer")
        if value < 0 or value > 1000000:
            raise ValueError("Invalid part number")
        self._part_number = value


async def upload_file(
    employee: Employee,
    file: File,
    metadata: dict[str, Any],
    bucket: R2Bucket,
    d1: D1Database,
):
    key = metadata.get("key")
    visibility = metadata.get("visibility", Visibility.PRIVATE.value)
    if not metadata.get("upload_id"):
        file_access: bool = await insert_file_access(
            d1,
            FileAccess(
                key=key,
                employee_id=employee.id,
                company_id=employee.company_id,
                visibility=visibility,
            ),
        )
        if not file_access:
            raise ValueError("Failed to insert file access")
        returned_file = await bucket.put(key, file.stream())
        return returned_file, 200
    elif metadata.get("upload_id"):
        # resume multi-part upload and store
        resumed_upload = bucket.resumeMultipartUpload(
            key,
            metadata.get("upload_id"),
        )
        returned_file_part = await resumed_upload.uploadPart(
            metadata.get("part"), file.stream()
        )
        return returned_file_part, 201
    else:
        raise ValueError("Invalid request")


@dataclass
class FileCreateStartBody:
    key: str
    visibility: Visibility
    _visibility: Visibility = field(default=Visibility.PUBLIC, init=False)

    @property
    def visibility(self):
        return self._visibility

    @visibility.setter
    def visibility(self, value: Visibility):
        if value not in Visibility:
            raise ValueError("Invalid visibility")
        self._visibility = value


@dataclass
class R2MultipartUploadResponse(R2MultipartUpload):
    key: str
    version: str


def file_create_start_factory(file_body: dict[str, Any] | list):
    match file_body:
        case dict():
            print(file_body)
            return FileCreateStartBody(**file_body)
        case list():
            return [R2UploadedPartBody(**part) for part in file_body]


async def make_multi_part_upload(
    employee: Employee,
    multi_part_body_raw: dict[str, Any] | list[dict[str, Any]],
    bucket: R2Bucket,
    d1: D1Database,
    upload_id: str | None = None,
    key_param: str | None = None,
    key_visibility: Visibility | None = None,
):
    """Create or resolve multi-part upload"""
    multi_part_body = file_create_start_factory(multi_part_body_raw)
    if not isinstance(multi_part_body, (FileCreateStartBody, list)):
        raise ValueError(f"Invalid request body {multi_part_body}")
    match multi_part_body:
        case FileCreateStartBody():
            key = multi_part_body.key
            new_multi_part_upload = await bucket.createMultipartUpload(key)
            return new_multi_part_upload
        case list():
            if upload_id is None or len(upload_id) <= 1:
                raise ValueError("Upload ID is required")
            if key_param is None:
                raise ValueError("Key is required")
            object_to_upload_to = bucket.resumeMultipartUpload(
                key_param,
                upload_id,
            )
            js_body = to_js(multi_part_body_raw)
            access = await insert_file_access(
                d1,
                file_access=FileAccess(
                    key=key_param,
                    employee_id=employee.id,
                    company_id=employee.company_id,
                    visibility=key_visibility,
                ),
            )
            if not access:
                raise ValueError("Failed to insert file access")
            final_file: R2Object = await object_to_upload_to.complete(js_body)
            return final_file
        case _:
            raise ValueError("Invalid request")


async def delete(
    files: list[FileId] | FileId,
    employee: Employee,
    bucket: R2Bucket,
):
    raise NotImplementedError("Not implemented")


def handle_cors_preflight():
    headers = Headers.new()
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
    headers.set("Access-Control-Max-Age", "86400")
    return Response.new(None, status=204, headers=headers)

def get_cors_headers():
    headers = Headers.new()
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
    return headers

async def on_fetch(request: WorkerRequestType, env: Env):
    method = Method(request.method)
    if method == Method.OPTIONS:
        return handle_cors_preflight()
    url_path, params = get_url_path_and_params(request.url)
    auth_with_token = (url_path == "download" and "token" in params)
    if "X-API-Key" not in request.headers and not auth_with_token:
        print(request.headers)
        print("No X-API-Key")
        js_error = json.dumps({"error": "Unauthorized"})
        return Response.json(js_error, status=401, headers=get_cors_headers())
    try:
        method = Method(request.method)
    except ValueError:
        js_error = json.dumps({"error": "Invalid method"})
        return Response.json(js_error, status=405, headers=get_cors_headers())
    if url_path not in ["files", "download"]:
        js_error = json.dumps({"error": "Not found"})
        return Response.json(js_error, status=404, headers=get_cors_headers())
    try:
        if not auth_with_token:
            employee = await authenticate_employee(request.headers["X-API-Key"], env)
        else:
            pass
    except (AssertionError, ValueError) as e:
        print(f"Unauthorized: {e}")
        js_error = json.dumps({"error": "Unauthorized"})
        return Response.json(js_error, status=401, headers=get_cors_headers())
    except Exception as e:
        print(f"Error: {e}")
        js_error = json.dumps({"error": "Internal server error"})
        return Response.json(js_error, status=500, headers=get_cors_headers())
    if not auth_with_token:
        try:
            employee_registered = await check_and_insert_employee(env.DB, employee)
            if not employee_registered:
                return Response.json(
                    {"error": "Employee registration failed, check jwt"}, status=400, headers=get_cors_headers()
                )
        except ValueError as e:
            print(f"Error: {e}")
            js_error = json.dumps({"error": str(e)})
            return Response.json(js_error, status=400, headers=get_cors_headers())
    match method:
        case Method.GET:
            if url_path == "download":
                print(f"Params: {params}")
                # /download/<file_key>?token=<token>
                file_key = params.get("file_name")
                token = params.get("token")
                if token:
                    try:
                        key_plus_employee = await validate_signed_url(
                            env, token
                        )
                        if key_plus_employee is None:
                            raise ValueError("Invalid or expired token")
                        validated_key = key_plus_employee[0]
                        employee_authorized = key_plus_employee[1]
                    except ValueError as e:
                        print(f"Error: {e}")
                        js_error = json.dumps({"error": str(e)})
                        return Response.json(js_error, status=400, headers=get_cors_headers())
                    if validated_key != file_key:
                        print(f"File key: {file_key}")
                        return Response.json(
                            to_js({"error": "Invalid or expired token"}), status=404, headers=get_cors_headers()
                        )
                    try:
                        file = await get_file(
                            file_key, employee_authorized, env.BUCKET, env.DB, None
                        )
                        if file is None:
                            raise FileNotFoundError("File not found")
                        headers = Headers.new()
                        headers.set("Content-Disposition", f'filename="{file.key}"')
                        readable_stream = file.to_py(default_converter=get_body)
                        headers.set("Content-Type", "application/octet-stream")
                        headers.set("Access-Control-Allow-Origin", "*")
                        headers.set("Access-Control-Allow-Methods", "GET")
                        headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
                        return Response.new(
                            readable_stream, headers=headers, status=200
                        )
                    except Exception as e:
                        return Response.json(to_js({"error": str(e)}), status=404, headers=get_cors_headers())
                elif not token:
                    token = await generate_signed_url_token(
                        env,
                        file_key,
                        employee_id=employee.id,
                        company_id=employee.company_id,
                    )
                    if not token:
                        return Response.json(
                            to_js({"error": "Failed to generate token"}), status=500
                        )
                    return Response.json(to_js({"token": token}), status=200, headers=get_cors_headers())
                else:
                    return Response.json(
                        to_js({"error": "Invalid request."}), status=400
                    )
            if params == {}:
                js_error = json.dumps({"error": "Invalid request - no params on GET."})
                return Response.json(js_error, status=400, headers=get_cors_headers())
            limit = params.get("limit", None)
            if limit is not None:
                limit = int(limit)
            cursor = params.get("cursor", None)
            range = params.get("range", None)
            onlyIf = params.get("onlyIf", None)
            get_key = params.get("key", None)
            if get_key is None and cursor is None and range is None and limit is None:
                js_error = json.dumps({"error": "Invalid request"})
                return Response.json(js_error, status=400, headers=get_cors_headers())
            if limit is not None or cursor is not None:
                options = ListOptions(limit=limit, cursor=cursor)
            elif range is not None or onlyIf is not None:
                options = GetOptions(range=range, onlyIf=onlyIf)
            else:
                options = None
            try:
                file = await get_file(get_key, employee, env.BUCKET, env.DB, options)
                if file is None:
                    raise FileNotFoundError("File not found")
            except ValueError as e:
                print(f"GET Value error: {e}")
                js_error = json.dumps({"error": str(e)})
                return Response.json(js_error, status=400, headers=get_cors_headers())
            except PermissionError as e:
                print(f"GET Permission error: {e}")
                js_error = json.dumps({"error": str(e)})
                return Response.json(js_error, status=403, headers=get_cors_headers())
            except FileNotFoundError as e:
                print(f"GET File not found error: {e}")
                js_error = json.dumps({"error": str(e)})
                return Response.json(js_error, status=404, headers=get_cors_headers())
            if hasattr(file, "body"):
                headers = Headers.new()
                headers.set("Content-Disposition", f'filename="{file.key}"')
                readable_stream = file.to_py(default_converter=get_body)
                headers.set("Content-Type", "application/octet-stream")
                response = Response.new(readable_stream, headers=headers, status=200)
                return response
            return Response.json(file, status=206)
        case Method.POST:
            if url_path != "files":
                return Response.json(to_js({"error": "Invalid request"}), status=400, headers=get_cors_headers())
            try:
                multi_part_body = await stream_to_json(request.body)
                upload_id = params.get("upload_id", None)
                key_param = params.get("key", None)
                key_visibility = params.get("visibility", None)
                file = await make_multi_part_upload(
                    employee,
                    multi_part_body_raw=multi_part_body,
                    bucket=env.BUCKET,
                    d1=env.DB,
                    upload_id=upload_id,
                    key_param=key_param,
                    key_visibility=key_visibility,
                )
            except (ValueError, JsException) as e:
                print(f"Error: {e}")
                js_error = json.dumps({"error": str(e)})
                return Response.json(js_error, status=400, headers=get_cors_headers())
            return Response.json(file, headers=get_cors_headers())
        case Method.PUT:
            if url_path != "files":
                return Response.json(to_js({"error": "Invalid request"}), status=400, headers=get_cors_headers())
            try:
                if int(request.headers["content-length"]) > DataSize.MB_100.value:
                    raise ValueError("File size too large")
                file, metadata = await parse_multipart_data(request)
                file, status = await upload_file(
                    employee, file=file, metadata=metadata, bucket=env.BUCKET, d1=env.DB
                )
            except (ValueError, TypeError, JsException) as e:
                print(f"PUT Error: {e}")
                if "TypeError" in str(e):
                    js_error = to_js({"error": "Multipart form-data required"})
                    return Response.json(js_error, status=400, headers=get_cors_headers())
                js_error = to_js({"error": str(e)})
                return Response.json(js_error, status=400, headers=get_cors_headers())

            return Response.json(file, status=status, headers=get_cors_headers())
        case Method.DELETE:
            if url_path != "files":
                return Response.json(to_js({"error": "Invalid request"}), status=400, headers=get_cors_headers())
            # file = await delete(request.body, employee, env.BUCKET)
            return Response.json({"message": "Not implemented"}, status=501, headers=get_cors_headers())
        case _:
            js_error = json.dumps({"error": "Method not allowed"})
            return Response.json(js_error, status=405, headers=get_cors_headers())
