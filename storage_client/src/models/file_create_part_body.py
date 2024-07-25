from io import BytesIO
from typing import Any, Dict, List, Type, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import File

T = TypeVar("T", bound="FileCreatePartBody")


@_attrs_define
class FileCreatePartBody:
    """
    Attributes:
        key (str):
        upload_id (str):
        part (int):
        content (File):
    """

    key: str
    upload_id: str
    part: int
    content: File
    additional_properties: Dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        key = self.key

        upload_id = self.upload_id

        part = self.part

        content = self.content.to_tuple()

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "key": key,
                "upload_id": upload_id,
                "part": part,
                "content": content,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        d = src_dict.copy()
        key = d.pop("key")

        upload_id = d.pop("upload_id")

        part = d.pop("part")

        content = File(payload=BytesIO(d.pop("content")))

        file_create_part_body = cls(
            key=key,
            upload_id=upload_id,
            part=part,
            content=content,
        )

        file_create_part_body.additional_properties = d
        return file_create_part_body

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
