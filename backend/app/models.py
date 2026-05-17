from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(String, default="")  # comma-separated list, e.g., "react, fastpi"
    category = Column(String, default="General")  # Personal, Work, Idea, Travel, etc.
    date = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
