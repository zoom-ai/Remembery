from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import schemas, crud
from app.database import get_db

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.get("/owner", response_model=schemas.UserResponse, summary="Get the main protagonist (owner)")
def get_owner(db: Session = Depends(get_db)):
    """
    Returns the primary user of the Remembery instance.
    If none exists, returns 404.
    """
    owner = crud.get_owner(db)
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found. Onboarding is required."
        )
    return owner

@router.post("/onboard", response_model=schemas.UserResponse, summary="Onboard the main protagonist")
def onboard_owner(payload: schemas.OnboardingRequest, db: Session = Depends(get_db)):
    """
    Creates the first 'owner' user. If one already exists, throws an error.
    """
    existing_owner = crud.get_owner(db)
    if existing_owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An owner already exists."
        )
    
    owner = crud.create_owner(db, payload)
    return owner

@router.post("/timeline", response_model=schemas.UserResponse, summary="Add a new event to the owner's timeline")
def add_timeline_event(payload: schemas.TimelineEventCreate, db: Session = Depends(get_db)):
    """
    Appends a new timeline event to the owner's timeline_json array.
    """
    owner = crud.get_owner(db)
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found. Onboarding is required."
        )
    
    updated_owner = crud.add_timeline_event(db, owner, payload)
    return updated_owner
