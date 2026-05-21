from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app import crud, schemas, models
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/memories",
    tags=["memories"]
)

@router.get("/", response_model=list[schemas.MemoryResponse])
def read_memories(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Enforce multi-tenant scoping: retrieve memories belonging to current_user.id
    return (
        db.query(models.Memory)
        .filter(models.Memory.user_id == current_user.id)
        .order_by(models.Memory.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

@router.post("/", response_model=schemas.MemoryResponse, status_code=status.HTTP_201_CREATED)
def create_memory(
    memory: schemas.MemoryCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Enforce multi-tenant scoping: set user_id to current_user.id
    db_date = memory.date if memory.date else datetime.now()
    db_memory = models.Memory(
        user_id=current_user.id,
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

@router.get("/{memory_id}", response_model=schemas.MemoryResponse)
def read_memory(
    memory_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_memory = crud.get_memory(db, memory_id=memory_id)
    if db_memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    if db_memory.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this memory")
    return db_memory

@router.delete("/{memory_id}", status_code=status.HTTP_200_OK)
def delete_memory(
    memory_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_memory = crud.get_memory(db, memory_id=memory_id)
    if db_memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    if db_memory.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this memory")
        
    crud.delete_memory(db, memory_id=memory_id)
    return {"message": "Memory deleted successfully", "id": memory_id}
