from http import HTTPStatus
from typing import Any, Dict, Optional, Union, cast

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.get_download_file_key_token_response_200 import GetDownloadFileKeyTokenResponse200
from ...types import Response


def _get_kwargs(
    file_key: str,
) -> Dict[str, Any]:
    _kwargs: Dict[str, Any] = {
        "method": "get",
        "url": f"/download/{file_key}/token",
    }

    return _kwargs


def _parse_response(
    *, client: Union[AuthenticatedClient, Client], response: httpx.Response
) -> Optional[Union[Any, GetDownloadFileKeyTokenResponse200]]:
    if response.status_code == HTTPStatus.OK:
        response_200 = GetDownloadFileKeyTokenResponse200.from_dict(response.json())

        return response_200
    if response.status_code == HTTPStatus.BAD_REQUEST:
        response_400 = cast(Any, None)
        return response_400
    if response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR:
        response_500 = cast(Any, None)
        return response_500
    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: Union[AuthenticatedClient, Client], response: httpx.Response
) -> Response[Union[Any, GetDownloadFileKeyTokenResponse200]]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    file_key: str,
    *,
    client: Union[AuthenticatedClient, Client],
) -> Response[Union[Any, GetDownloadFileKeyTokenResponse200]]:
    """Generate a download token for a file

    Args:
        file_key (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Union[Any, GetDownloadFileKeyTokenResponse200]]
    """

    kwargs = _get_kwargs(
        file_key=file_key,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    file_key: str,
    *,
    client: Union[AuthenticatedClient, Client],
) -> Optional[Union[Any, GetDownloadFileKeyTokenResponse200]]:
    """Generate a download token for a file

    Args:
        file_key (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Union[Any, GetDownloadFileKeyTokenResponse200]
    """

    return sync_detailed(
        file_key=file_key,
        client=client,
    ).parsed


async def asyncio_detailed(
    file_key: str,
    *,
    client: Union[AuthenticatedClient, Client],
) -> Response[Union[Any, GetDownloadFileKeyTokenResponse200]]:
    """Generate a download token for a file

    Args:
        file_key (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Union[Any, GetDownloadFileKeyTokenResponse200]]
    """

    kwargs = _get_kwargs(
        file_key=file_key,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    file_key: str,
    *,
    client: Union[AuthenticatedClient, Client],
) -> Optional[Union[Any, GetDownloadFileKeyTokenResponse200]]:
    """Generate a download token for a file

    Args:
        file_key (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Union[Any, GetDownloadFileKeyTokenResponse200]
    """

    return (
        await asyncio_detailed(
            file_key=file_key,
            client=client,
        )
    ).parsed
