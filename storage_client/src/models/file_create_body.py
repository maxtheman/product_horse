from io import BytesIO
from typing import Any, Dict, List, Type, TypeVar, Union

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.visibility import Visibility
from ..types import UNSET, File, Unset

T = TypeVar("T", bound="FileCreateBody")


@_attrs_define
class FileCreateBody:
    """
    Attributes:
        key (str):
        content (File):
        visibility (Union[Unset, Visibility]):
    """

    key: str
    content: File
    visibility: Union[Unset, Visibility] = UNSET
    additional_properties: Dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        key = self.key

        content = self.content.to_tuple()

        visibility: Union[Unset, str] = UNSET
        if not isinstance(self.visibility, Unset):
            visibility = self.visibility.value

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "key": key,
                "content": content,
            }
        )
        if visibility is not UNSET:
            field_dict["visibility"] = visibility

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        d = src_dict.copy()
        key = d.pop("key")

        content = File(payload=BytesIO(d.pop("content")))

        _visibility = d.pop("visibility", UNSET)
        visibility: Union[Unset, Visibility]
        if isinstance(_visibility, Unset):
            visibility = UNSET
        else:
            visibility = Visibility(_visibility)

        file_create_body = cls(
            key=key,
            content=content,
            visibility=visibility,
        )

        file_create_body.additional_properties = d
        return file_create_body

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
