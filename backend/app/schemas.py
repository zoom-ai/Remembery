from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class MemoryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str
    tags: Optional[str] = ""
    category: Optional[str] = "General"
    date: Optional[datetime] = None

class MemoryCreate(MemoryBase):
    pass

class MemoryResponse(MemoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
