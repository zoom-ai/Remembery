from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import get_db

router = APIRouter(
    prefix="/memories",
    tags=["memories"]
)

@router.get("/", response_model=list[schemas.MemoryResponse])
def read_memories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_memories(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.MemoryResponse, status_code=status.HTTP_201_CREATED)
def create_memory(memory: schemas.MemoryCreate, db: Session = Depends(get_db)):
    return crud.create_memory(db=db, memory=memory)

@router.get("/{memory_id}", response_model=schemas.MemoryResponse)
def read_memory(memory_id: int, db: Session = Depends(get_db)):
    db_memory = crud.get_memory(db, memory_id=memory_id)
    if db_memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    return db_memory

@router.delete("/{memory_id}", status_code=status.HTTP_200_OK)
def delete_memory(memory_id: int, db: Session = Depends(get_db)):
    success = crud.delete_memory(db, memory_id=memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"message": "Memory deleted successfully", "id": memory_id}
