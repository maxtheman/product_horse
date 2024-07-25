from http import HTTPStatus
from io import BytesIO
from typing import Any, Dict, Optional, Union, cast

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.r2_object import R2Object
from ...models.r2_object_list import R2ObjectList
from ...types import UNSET, File, Response, Unset


def _get_kwargs(
    *,
    key: Union[Unset, str] = UNSET,
    limit: Union[Unset, int] = UNSET,
    cursor: Union[Unset, str] = UNSET,
    range_: Union[Unset, str] = UNSET,
    only_if: Union[Unset, str] = UNSET,
) -> Dict[str, Any]:
    params: Dict[str, Any] = {}

    params["key"] = key

    params["limit"] = limit

    params["cursor"] = cursor

    params["range"] = range_

    params["onlyIf"] = only_if

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: Dict[str, Any] = {
        "method": "get",
        "url": "/files",
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: Union[AuthenticatedClient, Client], response: httpx.Response
) -> Optional[Union[Any, File, Union["R2Object", "R2ObjectList"]]]:
    if response.status_code == HTTPStatus.OK:
        response_200 = File(payload=BytesIO(response.content))

        return response_200
    if response.status_code == HTTPStatus.PARTIAL_CONTENT:

        def _parse_response_206(data: object) -> Union["R2Object", "R2ObjectList"]:
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                response_206_type_0 = R2Object.from_dict(data)

                return response_206_type_0
            except:  # noqa: E722
                pass
            if not isinstance(data, dict):
                raise TypeError()
            response_206_type_1 = R2ObjectList.from_dict(data)

            return response_206_type_1

        response_206 = _parse_response_206(response.json())

        return response_206
    if response.status_code == HTTPStatus.BAD_REQUEST:
        response_400 = cast(Any, None)
        return response_400
    if response.status_code == HTTPStatus.UNAUTHORIZED:
        response_401 = cast(Any, None)
        return response_401
    if response.status_code == HTTPStatus.FORBIDDEN:
        response_403 = cast(Any, None)
        return response_403
    if response.status_code == HTTPStatus.NOT_FOUND:
        response_404 = cast(Any, None)
        return response_404
    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: Union[AuthenticatedClient, Client], response: httpx.Response
) -> Response[Union[Any, File, Union["R2Object", "R2ObjectList"]]]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: Union[AuthenticatedClient, Client],
    key: Union[Unset, str] = UNSET,
    limit: Union[Unset, int] = UNSET,
    cursor: Union[Unset, str] = UNSET,
    range_: Union[Unset, str] = UNSET,
    only_if: Union[Unset, str] = UNSET,
) -> Response[Union[Any, File, Union["R2Object", "R2ObjectList"]]]:
    """Get file or list files

    Args:
        key (Union[Unset, str]):
        limit (Union[Unset, int]):
        cursor (Union[Unset, str]):
        range_ (Union[Unset, str]):
        only_if (Union[Unset, str]):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Union[Any, File, Union['R2Object', 'R2ObjectList']]]
    """

    kwargs = _get_kwargs(
        key=key,
        limit=limit,
        cursor=cursor,
        range_=range_,
        only_if=only_if,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    *,
    client: Union[AuthenticatedClient, Client],
    key: Union[Unset, str] = UNSET,
    limit: Union[Unset, int] = UNSET,
    cursor: Union[Unset, str] = UNSET,
    range_: Union[Unset, str] = UNSET,
    only_if: Union[Unset, str] = UNSET,
) -> Optional[Union[Any, File, Union["R2Object", "R2ObjectList"]]]:
    """Get file or list files

    Args:
        key (Union[Unset, str]):
        limit (Union[Unset, int]):
        cursor (Union[Unset, str]):
        range_ (Union[Unset, str]):
        only_if (Union[Unset, str]):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Union[Any, File, Union['R2Object', 'R2ObjectList']]
    """

    return sync_detailed(
        client=client,
        key=key,
        limit=limit,
        cursor=cursor,
        range_=range_,
        only_if=only_if,
    ).parsed


async def asyncio_detailed(
    *,
    client: Union[AuthenticatedClient, Client],
    key: Union[Unset, str] = UNSET,
    limit: Union[Unset, int] = UNSET,
    cursor: Union[Unset, str] = UNSET,
    range_: Union[Unset, str] = UNSET,
    only_if: Union[Unset, str] = UNSET,
) -> Response[Union[Any, File, Union["R2Object", "R2ObjectList"]]]:
    """Get file or list files

    Args:
        key (Union[Unset, str]):
        limit (Union[Unset, int]):
        cursor (Union[Unset, str]):
        range_ (Union[Unset, str]):
        only_if (Union[Unset, str]):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Union[Any, File, Union['R2Object', 'R2ObjectList']]]
    """

    kwargs = _get_kwargs(
        key=key,
        limit=limit,
        cursor=cursor,
        range_=range_,
        only_if=only_if,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: Union[AuthenticatedClient, Client],
    key: Union[Unset, str] = UNSET,
    limit: Union[Unset, int] = UNSET,
    cursor: Union[Unset, str] = UNSET,
    range_: Union[Unset, str] = UNSET,
    only_if: Union[Unset, str] = UNSET,
) -> Optional[Union[Any, File, Union["R2Object", "R2ObjectList"]]]:
    """Get file or list files

    Args:
        key (Union[Unset, str]):
        limit (Union[Unset, int]):
        cursor (Union[Unset, str]):
        range_ (Union[Unset, str]):
        only_if (Union[Unset, str]):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Union[Any, File, Union['R2Object', 'R2ObjectList']]
    """

    return (
        await asyncio_detailed(
            client=client,
            key=key,
            limit=limit,
            cursor=cursor,
            range_=range_,
            only_if=only_if,
        )
    ).parsed
