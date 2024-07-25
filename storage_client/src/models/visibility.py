from enum import Enum


class Visibility(str, Enum):
    INTERNAL = "INTERNAL"
    PRIVATE = "PRIVATE"
    PUBLIC = "PUBLIC"

    def __str__(self) -> str:
        return str(self.value)
