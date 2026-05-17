from datetime import datetime
from sqlalchemy.orm import Session
from app import models, schemas

def get_memories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Memory).order_by(models.Memory.date.desc()).offset(skip).limit(limit).all()

def get_memory(db: Session, memory_id: int):
    return db.query(models.Memory).filter(models.Memory.id == memory_id).first()

def create_memory(db: Session, memory: schemas.MemoryCreate):
    db_date = memory.date if memory.date else datetime.now()
    db_memory = models.Memory(
        title=memory.title,
        content=memory.content,
        tags=memory.tags,
        category=memory.category,
        date=db_date
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory

def delete_memory(db: Session, memory_id: int):
    db_memory = db.query(models.Memory).filter(models.Memory.id == memory_id).first()
    if db_memory:
        db.delete(db_memory)
        db.commit()
        return True
    return False
