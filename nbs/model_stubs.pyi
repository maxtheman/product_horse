from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from sqlmodel import SQLModel

class CreateUser(BaseModel):
    name: str
    external_id: str

class UpdateUser(BaseModel):
    name: str
    external_id: str
    created_at: datetime
    updated_at: datetime

class ReadUser(BaseModel):
    name: str
    external_id: str
    id: UUID
    created_at: datetime
    updated_at: datetime

