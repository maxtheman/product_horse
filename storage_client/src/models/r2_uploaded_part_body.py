from typing import Any, Dict, List, Type, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="R2UploadedPartBody")


@_attrs_define
class R2UploadedPartBody:
    """
    Attributes:
        etag (str):
        part_number (int):
    """

    etag: str
    part_number: int
    additional_properties: Dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        etag = self.etag

        part_number = self.part_number

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "etag": etag,
                "partNumber": part_number,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        d = src_dict.copy()
        etag = d.pop("etag")

        part_number = d.pop("partNumber")

        r2_uploaded_part_body = cls(
            etag=etag,
            part_number=part_number,
        )

        r2_uploaded_part_body.additional_properties = d
        return r2_uploaded_part_body

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
