from io import BytesIO
from typing import Any, Dict, List, Tuple, Type, TypeVar, Union

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.visibility import Visibility
from ..types import UNSET, File, Unset

T = TypeVar("T", bound="PutFilesBody")


@_attrs_define
class PutFilesBody:
    """
    Attributes:
        file (File):
        key (str):
        upload_id (Union[Unset, str]):
        part (Union[Unset, int]):
        visibility (Union[Unset, Visibility]):
    """

    file: File
    key: str
    upload_id: Union[Unset, str] = UNSET
    part: Union[Unset, int] = UNSET
    visibility: Union[Unset, Visibility] = UNSET
    additional_properties: Dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        file = self.file.to_tuple()

        key = self.key

        upload_id = self.upload_id

        part = self.part

        visibility: Union[Unset, str] = UNSET
        if not isinstance(self.visibility, Unset):
            visibility = self.visibility.value

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "file": file,
                "key": key,
            }
        )
        if upload_id is not UNSET:
            field_dict["upload_id"] = upload_id
        if part is not UNSET:
            field_dict["part"] = part
        if visibility is not UNSET:
            field_dict["visibility"] = visibility

        return field_dict

    def to_multipart(self) -> Dict[str, Any]:
        file = self.file.to_tuple()

        key = (None, str(self.key).encode(), "text/plain")

        upload_id = (
            self.upload_id if isinstance(self.upload_id, Unset) else (None, str(self.upload_id).encode(), "text/plain")
        )

        part = self.part if isinstance(self.part, Unset) else (None, str(self.part).encode(), "text/plain")

        visibility: Union[Unset, Tuple[None, bytes, str]] = UNSET
        if not isinstance(self.visibility, Unset):
            visibility = (None, str(self.visibility.value).encode(), "text/plain")

        field_dict: Dict[str, Any] = {}
        for prop_name, prop in self.additional_properties.items():
            field_dict[prop_name] = (None, str(prop).encode(), "text/plain")

        field_dict.update(
            {
                "file": file,
                "key": key,
            }
        )
        if upload_id is not UNSET:
            field_dict["upload_id"] = upload_id
        if part is not UNSET:
            field_dict["part"] = part
        if visibility is not UNSET:
            field_dict["visibility"] = visibility

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        d = src_dict.copy()
        file = File(payload=BytesIO(d.pop("file")))

        key = d.pop("key")

        upload_id = d.pop("upload_id", UNSET)

        part = d.pop("part", UNSET)

        _visibility = d.pop("visibility", UNSET)
        visibility: Union[Unset, Visibility]
        if isinstance(_visibility, Unset):
            visibility = UNSET
        else:
            visibility = Visibility(_visibility)

        put_files_body = cls(
            file=file,
            key=key,
            upload_id=upload_id,
            part=part,
            visibility=visibility,
        )

        put_files_body.additional_properties = d
        return put_files_body

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
