from http import HTTPStatus
from typing import Any, Dict, List, Optional, Union, cast

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.file_create_start_body import FileCreateStartBody
from ...models.r2_multipart_upload_response import R2MultipartUploadResponse
from ...models.r2_object import R2Object
from ...models.r2_uploaded_part_body import R2UploadedPartBody
from ...models.visibility import Visibility
from ...types import UNSET, Response, Unset


def _get_kwargs(
    *,
    body: Union["FileCreateStartBody", List["R2UploadedPartBody"]],
    upload_id: Union[Unset, str] = UNSET,
    key: Union[Unset, str] = UNSET,
    visibility: Union[Unset, Visibility] = UNSET,
) -> Dict[str, Any]:
    headers: Dict[str, Any] = {}

    params: Dict[str, Any] = {}

    params["upload_id"] = upload_id

    params["key"] = key

    json_visibility: Union[Unset, str] = UNSET
    if not isinstance(visibility, Unset):
        json_visibility = visibility.value

    params["visibility"] = json_visibility

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: Dict[str, Any] = {
        "method": "post",
        "url": "/files",
        "params": params,
    }

    _body: Union[Dict[str, Any], List[Dict[str, Any]]]
    if isinstance(body, FileCreateStartBody):
        _body = body.to_dict()
    else:
        _body = []
        for body_type_1_item_data in body:
            body_type_1_item = body_type_1_item_data.to_dict()
            _body.append(body_type_1_item)

    _kwargs["json"] = _body
    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: Union[AuthenticatedClient, Client], response: httpx.Response
) -> Optional[Union[Any, Union["R2MultipartUploadResponse", "R2Object"]]]:
    if response.status_code == HTTPStatus.OK:

        def _parse_response_200(data: object) -> Union["R2MultipartUploadResponse", "R2Object"]:
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                response_200_type_0 = R2MultipartUploadResponse.from_dict(data)

                return response_200_type_0
            except:  # noqa: E722
                pass
            if not isinstance(data, dict):
                raise TypeError()
            response_200_type_1 = R2Object.from_dict(data)

            return response_200_type_1

        response_200 = _parse_response_200(response.json())

        return response_200
    if response.status_code == HTTPStatus.BAD_REQUEST:
        response_400 = cast(Any, None)
        return response_400
    if response.status_code == HTTPStatus.UNAUTHORIZED:
        response_401 = cast(Any, None)
        return response_401
    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: Union[AuthenticatedClient, Client], response: httpx.Response
) -> Response[Union[Any, Union["R2MultipartUploadResponse", "R2Object"]]]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: Union[AuthenticatedClient, Client],
    body: Union["FileCreateStartBody", List["R2UploadedPartBody"]],
    upload_id: Union[Unset, str] = UNSET,
    key: Union[Unset, str] = UNSET,
    visibility: Union[Unset, Visibility] = UNSET,
) -> Response[Union[Any, Union["R2MultipartUploadResponse", "R2Object"]]]:
    """Create or complete multipart upload

    Args:
        upload_id (Union[Unset, str]):
        key (Union[Unset, str]):
        visibility (Union[Unset, Visibility]):
        body (Union['FileCreateStartBody', List['R2UploadedPartBody']]):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Union[Any, Union['R2MultipartUploadResponse', 'R2Object']]]
    """

    kwargs = _get_kwargs(
        body=body,
        upload_id=upload_id,
        key=key,
        visibility=visibility,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    *,
    client: Union[AuthenticatedClient, Client],
    body: Union["FileCreateStartBody", List["R2UploadedPartBody"]],
    upload_id: Union[Unset, str] = UNSET,
    key: Union[Unset, str] = UNSET,
    visibility: Union[Unset, Visibility] = UNSET,
) -> Optional[Union[Any, Union["R2MultipartUploadResponse", "R2Object"]]]:
    """Create or complete multipart upload

    Args:
        upload_id (Union[Unset, str]):
        key (Union[Unset, str]):
        visibility (Union[Unset, Visibility]):
        body (Union['FileCreateStartBody', List['R2UploadedPartBody']]):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Union[Any, Union['R2MultipartUploadResponse', 'R2Object']]
    """

    return sync_detailed(
        client=client,
        body=body,
        upload_id=upload_id,
        key=key,
        visibility=visibility,
    ).parsed


async def asyncio_detailed(
    *,
    client: Union[AuthenticatedClient, Client],
    body: Union["FileCreateStartBody", List["R2UploadedPartBody"]],
    upload_id: Union[Unset, str] = UNSET,
    key: Union[Unset, str] = UNSET,
    visibility: Union[Unset, Visibility] = UNSET,
) -> Response[Union[Any, Union["R2MultipartUploadResponse", "R2Object"]]]:
    """Create or complete multipart upload

    Args:
        upload_id (Union[Unset, str]):
        key (Union[Unset, str]):
        visibility (Union[Unset, Visibility]):
        body (Union['FileCreateStartBody', List['R2UploadedPartBody']]):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Union[Any, Union['R2MultipartUploadResponse', 'R2Object']]]
    """

    kwargs = _get_kwargs(
        body=body,
        upload_id=upload_id,
        key=key,
        visibility=visibility,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: Union[AuthenticatedClient, Client],
    body: Union["FileCreateStartBody", List["R2UploadedPartBody"]],
    upload_id: Union[Unset, str] = UNSET,
    key: Union[Unset, str] = UNSET,
    visibility: Union[Unset, Visibility] = UNSET,
) -> Optional[Union[Any, Union["R2MultipartUploadResponse", "R2Object"]]]:
    """Create or complete multipart upload

    Args:
        upload_id (Union[Unset, str]):
        key (Union[Unset, str]):
        visibility (Union[Unset, Visibility]):
        body (Union['FileCreateStartBody', List['R2UploadedPartBody']]):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Union[Any, Union['R2MultipartUploadResponse', 'R2Object']]
    """

    return (
        await asyncio_detailed(
            client=client,
            body=body,
            upload_id=upload_id,
            key=key,
            visibility=visibility,
        )
    ).parsed
