# type: ignore
from js import Response, Headers, console, ReadableStream, Object
from base64 import b64encode
from jwt import decode_jwt
import uuid
from cf_types import (
    Method,
    Env,
    WorkerRequestType,
    JwtPayload,
    D1Database,
    File,
    R2ListOptions,
    FileCreate,
    FileCreatePart,
    FileCreateStart,
    FileId,
    R2Object,
    R2ObjectBody,
    R2Bucket,
    Employee,
    R2UploadedPart,
    Visibility,
    R2MultipartUpload
)
from db_ops import (
    check_and_insert_employee,
    insert_file_access,
    check_file_access,
    remove_file_access,
)
from typing import Optional, List, Any
from datetime import datetime
from dataclasses import field, dataclass, asdict
from pyodide.ffi import JsException, to_js as _to_js
import json

class DataSize:
    MB_100 = 100 * 1024 * 1024
    MB_1000 = 1000 * 1024 * 1024

def to_js(obj):
   return _to_js(obj, dict_converter=Object.fromEntries)

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

def json_response(data):
    data = json.dumps(data)
    headers = Headers.new({"content-type": "application/json"}.items())
    return Response.new(data, headers=headers)

def direct_binary_response(data: bytes, content_type: str):
    headers = Headers.new({
        "Content-Type": content_type,
        "Content-Length": str(len(data))
    }.items())
    return Response.new(data, headers=headers)

def multipart_response(parts: List[tuple[bytes, str, str]]):
    boundary = str(uuid.uuid4())
    body = b""
    for data, content_type, name in parts:
        body += f"\r\n--{boundary}\r\n".encode()
        body += f"Content-Disposition: form-data; name=\"{name}\"\r\n".encode()
        body += f"Content-Type: {content_type}\r\n\r\n".encode()
        body += data
    body += f"\r\n--{boundary}--\r\n".encode()

    headers = Headers.new({"Content-Type": f"multipart/form-data; boundary={boundary}"}.items())
    return Response.new(body, headers=headers)

async def stream_to_json(stream: ReadableStream) -> dict[str, Any]:
    body_chunks = []
    async for chunk in stream:
        body_chunks.append(chunk.to_py())
    body_bytes = b''.join(body_chunks)
    body_str = body_bytes.decode('utf-8')
    return json.loads(body_str)

async def base64_encode(data: bytes) -> str:
    return b64encode(data).decode('utf-8')


async def create_employee(
    employee: Employee,
    db: D1Database,
):
    """Create an employee.
    Returns whether the employee was created or not."""
    employee_created = await check_and_insert_employee(db, employee)
    return employee_created

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
async def get_file(
    key: str | None,
    employee: Employee,
    bucket: R2Bucket,
    options: GetOptions | R2ListOptions | None,
):
    #TODO: check intended file visibility
    if options is None:
        object: R2Object | R2ObjectBody = await bucket.get(key)
        return object
    decoded_options: dict[str, Any] = asdict(options)
    if 'limit' in decoded_options or 'cursor' in decoded_options:
        objects = await bucket.list(options=decoded_options)
        return objects
    elif key is not None:
        object: R2Object | R2ObjectBody = await bucket.get(key)
    elif key is not None and ('range' in decoded_options or 'onlyIf' in decoded_options):
        object: R2Object | R2ObjectBody = await bucket.get(key, options=decoded_options)
    if 'body' not in object:
        raise ValueError("Invalid object - options failed")
    elif 'body' in object:
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
    file_body: FileCreate | FileCreatePart,
    bucket: R2Bucket,
):
    #TODO: store intended file visibility
    file_request = file_create_factory(file_body)
    if isinstance(file_request, FileCreateBody):
        returned_file = await bucket.put(file_request.key, file_request.content)
        return returned_file
    elif isinstance(file_request, FileCreatePartBody):
        # resume multi-part upload and store
        resumed_upload = bucket.resumeMultipartUpload(
            file_request.key,
            file_request.upload_id,
        )
        returned_file_part = await resumed_upload.uploadPart(file_request.part, file_request.content)
        return returned_file_part
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
            return FileCreateStartBody(**file_body)
        case list():
            return [R2UploadedPartBody(**part) for part in file_body]

async def multi_part_upload(
    employee: Employee,
    multi_part_body_raw: dict[str, Any] | list[dict[str, Any]],
    bucket: R2Bucket,
    upload_id: str | None = None,
    key_param: str | None = None,
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
            console.log(js_body)
            final_file: R2Object = await object_to_upload_to.complete(
                js_body
            )
            print('final_file', final_file)
            return final_file
        case _:
            return Response.json({"error": "Invalid request"}, status=400)


async def delete(
    files: list[FileId] | FileId,
    employee: Employee,
    bucket: R2Bucket,
):
    raise NotImplementedError("Not implemented")


async def on_fetch(request: WorkerRequestType, env: Env):
    if "X-API-Key" not in request.headers:
        print("No X-API-Key")
        return Response.json({"error": "Unauthorized"}, status=401)
    method = Method(request.method)
    url_path = request.url.split("/")[-1]
    params = {}
    try:
        param_string = ""
        if "?" in url_path:
            param_string = url_path.split("?")[-1]
            url_path = url_path.split("?")[0]
        if '&' in param_string:
            param_strings = param_string.split("&")
            params = {param.split("=")[0]: param.split("=")[1] for param in param_strings}
        elif '=' in param_string:
            params = {param_string.split("=")[0]: param_string.split("=")[1]}
    except ValueError:
        params = {}
    try:
        employee = await authenticate_employee(request.headers["X-API-Key"], env)
    except (AssertionError, ValueError) as e:
        print(f"Unauthorized: {e}")
        return Response.json({"error": "Unauthorized"}, status=401)
    except Exception as e:
        print(f"Error: {e}")
        return Response.json({"error": "Internal server error"}, status=500)
    if url_path not in ["files", "employees"]:
        return Response.json({"error": "Not found"}, status=404)
    match method:
        case Method.GET:
            limit = params.get("limit", None)
            if limit is not None:
                limit = int(limit)
            cursor = params.get("cursor", None)
            range = params.get("range", None)
            onlyIf = params.get("onlyIf", None)
            get_key = params.get("key", None)
            if get_key is None and cursor is None and range is None and limit is None:
                return Response.json({"error": "Invalid request"}, status=400)
            if limit is not None or cursor is not None:
                options = ListOptions(limit=limit, cursor=cursor)
            elif range is not None or onlyIf is not None:
                options = GetOptions(range=range, onlyIf=onlyIf)
            else:
                options = None
            try:
                file = await get_file(
                    get_key, employee, env.BUCKET, options
                )
            except ValueError as e:
                print(f"Error: {e}")
                return Response.json({"error": str(e)}, status=400)
            return Response.json(file)
        case Method.POST:
            try:
                multi_part_body = await stream_to_json(request.body)
                upload_id = params.get("upload_id", None)
                key_param = params.get("key", None)
                file = await multi_part_upload(
                    employee,
                    multi_part_body_raw=multi_part_body,
                    bucket=env.BUCKET,
                    upload_id=upload_id,
                    key_param=key_param,
                )
            except ValueError as e:
                print(f"Error: {e}")
                return Response.json({"error": str(e)}, status=400)
            return Response.json(file)
        case Method.PUT:
            try:
                file_body = await stream_to_json(request.body)
                file = await upload_file(employee, file_body=file_body, bucket=env.BUCKET)
            except (ValueError, TypeError, JsException) as e:
                print(f"Error: {e}")
                return Response.json({"error": str(e)}, status=400)
            return Response.json(file)
        case Method.DELETE:
            file = await delete(request.body, employee, env.BUCKET)
            return Response.json(file)
        case _:
            return Response.json({"error": "Method not allowed"}, status=405)
