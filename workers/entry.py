# type: ignore
from js import Response
from hashlib import sha256
from jwt import decode_jwt
from cf_types import (
    Method,
    Env,
    WorkerRequestType,
    D1Database,
    R2UploadedPart,
    R2Object,
    R2UploadedPart,
)
from fastapi import FastAPI, Request as FastRequest
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, TypedDict, Enum
import asgi
# from collections import namedtuple

# CORE WORKER
# can't connect with hyperdrive due to rls - hyperdrive doesn't support SET.


class PermissionLevel(Enum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"


class Visibility(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    PRIVATE = "private"


class Employee(TypedDict):
    id: str
    company_id: str
    permission_level: PermissionLevel


class FileId(BaseModel):
    id: str


class File(FileId):
    id: str
    name: str


class FileAccess(File):
    visibility: Visibility
    employee_id: str
    company_id: str


class FileCreateStart(File):
    visibility: Visibility


class FileCreate(File):
    visibility: Visibility
    content: str | bytes


class FileCreatePart(File):
    upload_id: str
    part: int
    content: str | bytes


async def insert_employee(db: D1Database[Employee], employee: Employee):
    query = "INSERT INTO employees (employee_id, company_id, permission_level) VALUES (?1, ?2, ?3)"
    statement = await db.prepare(query)
    binding = statement.bind(
        employee.id, employee.company_id, employee.permission_level
    )
    result = await binding.run()
    return result.success


async def insert_file_access(db: D1Database[FileAccess], file_access: FileAccess):
    query = "INSERT INTO file_access (file_id, employee_id, company_id, visibility) VALUES (?1, ?2, ?3, ?4)"
    statement = await db.prepare(query)
    binding = statement.bind(
        file_access.id,
        file_access.employee_id,
        file_access.company_id,
        file_access.visibility,
    )
    result = await binding.run()
    return result.success


async def check_file_access(
    db: D1Database[bool], file_name: str, employee: Employee
) -> bool:
    query = """
    Select
     case
        when file.visibility = 'public' then true # public
        when file.visibility = 'internal' and file.company_id = ?3 then true # internal
        when file.visibility = 'private' and file.employee_id = ?2 and file.company_id = ?3 then true # private
        else false
     end
    from(
    SELECT *
    FROM files
    WHERE file_name = ?1
    ) as file
    """
    statement = await db.prepare(query)
    binding = statement.bind(file_name, employee.id, employee.company_id)
    result: bool | None = await binding.first()
    if result is None:
        return False
    return result


async def remove_file_access(db: D1Database[FileAccess], file_access: FileAccess):
    query = "DELETE FROM file_access WHERE file_id = ?1 and employee_id = ?2 and company_id = ?3"
    statement = await db.prepare(query)
    binding = statement.bind(
        file_access.id, file_access.employee_id, file_access.company_id
    )
    result = await binding.run()
    return result.success


async def on_fetch(request, env):
    # authenticate and do cf-specific operations here.
    return await asgi.fetch(app, request, env)


app = FastAPI()


@app.post("/employee")
async def create_employee(request: FastRequest, employee: Employee): ...


@app.get("/file")
async def get_file(
    request: FastRequest, limit: Optional[int] = None, cursor: Optional[str] = None
): ...


@app.put("/file")
async def upload_file(
    request: FastRequest, file: FileCreate | FileCreatePart
) -> R2Object | R2UploadedPart:
    match file:
        case FileCreate():
            return R2Object(
                key="example_key",
                version="1",
                size=123,
                etag="example_etag",
                httpEtag="example_http_etag",
                uploaded=datetime.now(),
                httpMetadata={},
                customMetadata={},
                range=None,
                storageClass=None,
            )
        case FileCreatePart():
            return R2UploadedPart(
                part_number=file.part,
                etag="test",
            )
        case _:
            return Response.new("Invalid request", status=400)


@app.post("/file")
async def post_file(
    request: FastRequest,
    start_multi_part: FileCreateStart,
    resolve_multi_part: List[R2UploadedPart],
):
    """Create or resolve multi-part upload"""
    ...


@app.delete("/file")
async def delete(request: FastRequest, files: list[FileId] | FileId): ...


async def not_used(request: WorkerRequestType, env: Env):
    method = Method(request.method)
    # look at onlyIf on R2GetOptions R2PutOptions? caching it seems - etag.
    jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXBsb3llZV9pZCI6Ijk1NmVkNWE5LWRjMmEtNDdiMS05NGFmLWFjYTQ1YTI3NDBjMyIsImV4cCI6MTcyMTUyMTk3NX0.DgR02ZFcXs4FkBD57yge66xr0S9p46mOcJn4oL5DHg0"
    decoded = decode_jwt(jwt, env.SECRET)
    print(
        decoded
    )  # {'employee_id': '956ed5a9-dc2a-47b1-94af-aca45a2740c3', company_id: '123', 'exp': 1721521975}
    test_sha = sha256(b"asdf").hexdigest()
    bucket = await env.MY_BUCKET.list()
    print(bucket.objects.to_py())
    match method:
        case Method.GET:
            response = Response.new(
                f"Hello {type(request.body)}! {bucket.objects}, {test_sha}"
            )
            return response
        case Method.POST:
            return Response.new(f"Hello {method}! {env.MY_BUCKET}", {"status": 200})
        case _:
            return Response.new(f"Hello {method}! {env.MY_BUCKET}")
