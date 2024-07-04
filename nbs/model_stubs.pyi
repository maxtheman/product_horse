from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from sqlmodel import SQLModel

class CreateUser(BaseModel):
    company_id: UUID
    created_by_id: UUID
    name: str
    external_id: str

class UpdateUser(BaseModel):
    company_id: UUID
    created_by_id: UUID
    name: str
    external_id: str
    created_at: datetime
    updated_at: datetime

class ReadUser(BaseModel):
    company_id: UUID
    created_by_id: UUID
    name: str
    external_id: str
    id: UUID
    created_at: datetime
    updated_at: datetime

