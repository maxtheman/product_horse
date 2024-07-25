import datetime
from typing import Any, Dict, List, Type, TypeVar, Union

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

from ..types import UNSET, Unset

T = TypeVar("T", bound="R2Object")


@_attrs_define
class R2Object:
    """
    Attributes:
        key (Union[Unset, str]):
        size (Union[Unset, int]):
        etag (Union[Unset, str]):
        http_etag (Union[Unset, str]):
        uploaded (Union[Unset, datetime.datetime]):
    """

    key: Union[Unset, str] = UNSET
    size: Union[Unset, int] = UNSET
    etag: Union[Unset, str] = UNSET
    http_etag: Union[Unset, str] = UNSET
    uploaded: Union[Unset, datetime.datetime] = UNSET
    additional_properties: Dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        key = self.key

        size = self.size

        etag = self.etag

        http_etag = self.http_etag

        uploaded: Union[Unset, str] = UNSET
        if not isinstance(self.uploaded, Unset):
            uploaded = self.uploaded.isoformat()

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if key is not UNSET:
            field_dict["key"] = key
        if size is not UNSET:
            field_dict["size"] = size
        if etag is not UNSET:
            field_dict["etag"] = etag
        if http_etag is not UNSET:
            field_dict["httpEtag"] = http_etag
        if uploaded is not UNSET:
            field_dict["uploaded"] = uploaded

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        d = src_dict.copy()
        key = d.pop("key", UNSET)

        size = d.pop("size", UNSET)

        etag = d.pop("etag", UNSET)

        http_etag = d.pop("httpEtag", UNSET)

        _uploaded = d.pop("uploaded", UNSET)
        uploaded: Union[Unset, datetime.datetime]
        if isinstance(_uploaded, Unset):
            uploaded = UNSET
        else:
            uploaded = isoparse(_uploaded)

        r2_object = cls(
            key=key,
            size=size,
            etag=etag,
            http_etag=http_etag,
            uploaded=uploaded,
        )

        r2_object.additional_properties = d
        return r2_object

    @property
    def additional_keys(self) -> List[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
