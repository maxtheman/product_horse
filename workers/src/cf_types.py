from typing import (
    Any,
    Dict,
    List,
    Optional,
    Union,
    Protocol,
    Literal,
    TypeVar,
    Generic,
    TypedDict,
)
from dataclasses import dataclass, field
from enum import IntEnum, Enum
from datetime import datetime


# FILES
@dataclass
class FileId:
    id: str


class File(FileId):
    key: str
    name: str

@dataclass
class FileAccess:
    key: str
    visibility: "Visibility"
    employee_id: str
    company_id: str


class FileCreateStart(File):
    visibility: "Visibility"


class FileCreate(File):
    visibility: "Visibility"
    content: str | bytes


class FileCreatePart(File):
    upload_id: str
    part: int
    content: str | bytes

@dataclass
class FileResponseHeaders:
    file_id: str
    file_name: str
    file_size: int
    file_type: str
    created_at: datetime


# EMPLOYEE


class PermissionLevel(IntEnum):
    READ = 1
    WRITE = 2
    ADMIN = 3


# WORKER ENV


class Visibility(Enum):
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    PRIVATE = "PRIVATE"


@dataclass
class Employee:
    id: str
    company_id: str
    permission_level: PermissionLevel  # type: ignore
    _permission_level: PermissionLevel = field(init=False, default=PermissionLevel.READ)

    def __post_init__(self):
        self._permission_level = self.permission_level

    @property
    def permission_level(self) -> PermissionLevel:
        return self._permission_level

    @permission_level.setter
    def permission_level(self, value: PermissionLevel) -> None:
        if value not in PermissionLevel:
            raise ValueError("Invalid permission level")
        self._permission_level = value


class JwtPayload(TypedDict):
    id: str
    company_id: str
    exp: float
    permission_level: PermissionLevel


# WORKER ENV


class Method(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    OPTIONS = "OPTIONS"


class Headers(Protocol):
    """See https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests#conditional_headers"""

    pass


class CfMinify:
    javascript: bool
    css: bool
    html: bool


class RequestInitCfProperties(Protocol):
    """
    An object containing Cloudflare-specific properties that can be set on the Request object
    See: https://developers.cloudflare.com/workers/runtime-apis/request#the-cf-property-requestinitcfproperties

    apps  optional
    Whether Cloudflare Apps should be enabled for this request. Defaults to true.

    cacheEverything  optional
    Treats all content as static and caches all file types beyond the Cloudflare default cached content. Respects cache headers from the origin web server. This is equivalent to setting the Page Rule Cache Level (to Cache Everything). Defaults to false. This option applies to GET and HEAD request methods only.

    cacheKey  optional
    A request’s cache key is what determines if two requests are the same for caching purposes. If a request has the same cache key as some previous request, then Cloudflare can serve the same cached response for both.

    cacheTags  optional
    This option appends additional Cache-Tag headers to the response from the origin server. This allows for purges of cached content based on tags provided by the Worker, without modifications to the origin server.

    cacheTtl  optional
    This option forces Cloudflare to cache the response for this request, regardless of what headers are seen on the response. This is equivalent to setting two Page Rules: Edge Cache TTL and Cache Level (to Cache Everything). The value must be zero or a positive number. A value of 0 indicates that the cache asset expires immediately. This option applies to GET and HEAD request methods only.

    cacheTtlByStatus  optional
    This option is a version of the cacheTtl feature which chooses a TTL based on the response’s status code. If the response to this request has a status code that matches, Cloudflare will cache for the instructed time and override cache instructives sent by the origin.

    image  optional
    Enables Image Resizing for this request. The possible values are described in Transform images via Workers documentation.

    minify  optional
    Enables or disables AutoMinify for various file types. For example: { javascript: true, css: true, html: false }.

    mirage  optional
    Whether Mirage should be enabled for this request, if otherwise configured for this zone. Defaults to true.

    polish  optional
    Sets Polish mode. The possible values are lossy, lossless or off.
    resolveOverride  optional

    Directs the request to an alternate origin server by overriding the DNS lookup.

    scrapeShield  optional
    Whether ScrapeShield should be enabled for this request, if otherwise configured for this zone. Defaults to true.

    webp  optional
    Enables or disables WebP image format in "Polish" mode.
    """

    apps: Optional[bool]
    cacheEverything: Optional[bool]
    cacheKey: Optional[str]
    cacheTags: Optional[List[str]]
    cacheTtl: Optional[int]
    cacheTtlByStatus: Optional[Dict[str, int]]
    image: Optional[bool]
    minify: Optional[CfMinify]
    mirage: Optional[bool]
    polish: Optional[Literal["lossy", "lossless", "off"]]
    resolveOverride: Optional[str]
    scrapeShield: Optional[bool]
    webp: Optional[bool]


class WorkerRequestType(Protocol):
    """
    All properties of an incoming Request object (the request you receive from the fetch() handler) are read-only. To modify the properties of an incoming request, create a new Request object and pass the options to modify to its constructor.
    """

    body: Optional[Union[str, bytes]]
    bodyUsed: bool
    cf: RequestInitCfProperties
    headers: Headers
    method: Literal["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    url: str
    redirect: Literal["follow", "error", "manual"]


# R2 SPECIFIC


class R2Range(Protocol):
    """
    offset
    The byte to begin returning data from, inclusive.

    length
    The number of bytes to return. If more bytes are requested than exist in the object, fewer bytes than this number may be returned.

    suffix
    The number of bytes to return from the end of the file, starting from the last byte. If more bytes are requested than exist in the object, fewer bytes than this number may be returned."""

    offset: int
    length: Optional[int]
    suffix: int


class R2HttpMetadata(Protocol):
    """
    HTTP Metadata
    Generally, these fields match the HTTP metadata passed when the object was created. They can be overridden when issuing GET requests, in which case, the given values will be echoed back in the response.
    """

    contentType: Optional[str]
    contentLanguage: Optional[str]
    contentDisposition: Optional[str]
    contentEncoding: Optional[str]
    cacheControl: Optional[str]
    cacheExpiry: Optional[datetime]


class Checksums(Protocol):
    """
    Checksums
    If a checksum was provided when using the put() binding, it will be available on the returned object under the checksums property. The MD5 checksum will be included by default for non-multipart objects.
    """

    md5: Optional[bytes]
    sha1: Optional[bytes]
    sha256: Optional[bytes]
    sha384: Optional[bytes]
    sha512: Optional[bytes]

@dataclass
class R2Object:
    """
    R2Object is created when you PUT an object into an R2 bucket. R2Object represents the metadata of an object based on the information provided by the uploader. Every object that you PUT into an R2 bucket will have an R2Object created.
    """

    key: str
    version: str
    size: int
    etag: str
    httpEtag: str
    uploaded: datetime
    httpMetadata: R2HttpMetadata
    customMetadata: Dict[str, str]
    range: Optional[Dict[str, int]]
    checksums: Checksums
    storageClass: Optional[Literal["Standard", "InfrequentAccess"]]

    def writeHttpMetadata(self, headers: Headers) -> None: ...

@dataclass
class R2ObjectBody(R2Object):
    body: Union[str, bytes]
    bodyUsed: bool

    async def arrayBuffer(self) -> bytes: ...
    async def text(self) -> str: ...
    async def json(self) -> Any: ...
    async def blob(self) -> bytes: ...


class R2Objects(Protocol):
    objects: List[R2Object]
    truncated: bool
    cursor: Optional[str]
    delimitedPrefixes: Optional[List[str]]


class R2UploadedPart(Protocol):
    partNumber: int
    etag: str


class R2MultipartUpload(Protocol):
    key: str
    uploadId: str

    async def uploadPart(
        self, partNumber: int, value: int | str | bytes
    ) -> R2UploadedPart: ...
    async def abort(self) -> None: ...
    async def complete(self, uploadedParts: List[R2UploadedPart]) -> R2Object: ...


class R2Conditional(Protocol):
    "You can pass an R2Conditional object to R2GetOptions and R2PutOptions. If the condition check for get() fails, the body will not be returned. This will make get() have lower latency."

    etagMatches: Optional[str]
    etagDoesNotMatch: Optional[str]
    uploadedBefore: Optional[datetime]
    uploadedAfter: Optional[datetime]


class R2GetOptions(Protocol):
    onlyIf: Optional[R2Conditional]
    range: Optional[Dict[str, Union[int, str]]]


class R2PutOptions(Protocol):
    onlyIf: Optional[R2Conditional]
    httpMetadata: Optional[Dict[str, str]]
    customMetadata: Optional[Dict[str, str]]
    md5: Optional[str]
    sha1: Optional[str]
    sha256: Optional[str]
    sha384: Optional[str]
    sha512: Optional[str]
    storageClass: Optional[str]


class R2MultipartOptions(Protocol):
    httpMetadata: Optional[Dict[str, str]]
    customMetadata: Optional[Dict[str, str]]
    storageClass: Optional[str]


class R2ListOptions(Protocol):
    limit: Optional[int]
    prefix: Optional[str]
    cursor: Optional[str]
    delimiter: Optional[str]
    include: Optional[List[str]]


class R2Bucket(Protocol):
    objects: R2Objects

    async def head(self, key: str) -> Optional[Union[R2Object, None]]: ...
    async def get(
        self, key: str, options: Optional[R2GetOptions] = None
    ) -> Optional[Union[R2Object, R2ObjectBody]]: ...
    async def put(
        self,
        key: str,
        value: Union[str, bytes],
        options: Optional[Dict[str, Any]] = None,
    ) -> Optional[R2Object]: ...
    async def delete(self, keys: Union[str, List[str]]) -> None: ...
    async def list(self, options: R2ListOptions) -> R2Objects: ...
    async def createMultipartUpload(
        self, key: str, options: Optional[Dict[str, Any]] = None
    ) -> R2MultipartUpload: ...
    def resumeMultipartUpload(
        self, key: str, uploadId: str
    ) -> R2MultipartUpload: ...


# D1
T = TypeVar("T")


class D1ResultMetrics(Generic[T]):
    success: bool
    meta: Dict[str, int]


class D1Result(Generic[T]):
    pass

    def __getitem__(self, item: str) -> Any: ...


class D1Results(Generic[T]):
    success: bool
    meta: Dict[str, int]
    results: List[D1Result[T]]

    def __getitem__(self, key: str) -> D1Result[T]: ...


class D1ExecResult:
    pass


class D1PreparedStatement(Generic[T]):
    async def all(self) -> D1Results[T]: ...
    async def raw(
        self, options: Optional[Dict[str, bool]] = None
    ) -> List[List[Any]]: ...
    async def first(self, column: Optional[str] = None) -> Optional[T]: ...
    async def run(self) -> D1ResultMetrics[None]: ...
    def bind(self, *args: Any) -> "D1PreparedStatement[T]": ...


class D1Database(Generic[T]):
    def prepare(self, query: str) -> D1PreparedStatement[T]: ...
    async def dump(self) -> bytes: ...
    async def exec(self, query: str) -> D1ExecResult: ...
    async def batch(
        self, statements: List[D1PreparedStatement[T]]
    ) -> List[D1Result[T]]: ...


class Env(Protocol):
    MY_BUCKET: R2Bucket
    DB: D1Database[Any]
    SECRET: str
