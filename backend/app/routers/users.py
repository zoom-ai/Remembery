import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app import schemas, crud, models
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.get("/owner", response_model=schemas.UserResponse, summary="Get the main protagonist (owner)")
def get_owner(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Returns the primary user of the Remembery instance (the currently logged in user).
    """
    return current_user

@router.post("/onboard", response_model=schemas.UserResponse, summary="Onboard the main protagonist")
def onboard_owner(
    payload: schemas.OnboardingRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Onboards the current logged-in user by updating their profile details.
    """
    current_user.display_name = payload.display_name
    current_user.title = payload.title
    current_user.bio = payload.bio
    current_user.birth_date = payload.birth_date
    current_user.death_date = payload.death_date
    current_user.birth_place = payload.birth_place
    current_user.resting_place = payload.resting_place
    current_user.motto = payload.motto
    current_user.timeline_json = payload.timeline_json
    current_user.role = "owner"  # Elevate role to owner
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/timeline", response_model=schemas.UserResponse, summary="Add a new event to the owner's timeline")
def add_timeline_event(
    payload: schemas.TimelineEventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Appends a new timeline event to the current user's timeline_json array.
    """
    updated_owner = crud.add_timeline_event(db, current_user, payload)
    return updated_owner

@router.delete("/timeline/{index}", response_model=schemas.UserResponse, summary="Delete an event from the owner's timeline")
def delete_timeline_event(
    index: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Removes a timeline event at the specified index from the current user's timeline_json array.
    """
    updated_owner = crud.delete_timeline_event(db, current_user, index)
    return updated_owner

@router.patch("/owner", response_model=schemas.UserResponse, summary="Update the main protagonist's profile")
def update_owner_profile(
    payload: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Updates text metadata for the current user's profile.
    """
    updated_owner = crud.update_owner(db, current_user, payload)
    return updated_owner

@router.post("/owner/avatar", response_model=schemas.UserResponse, summary="Upload avatar image for owner")
def upload_owner_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Uploads an avatar image and updates the current user's avatar_url.
    """
    # Create avatars directory if it doesn't exist
    upload_dir = os.path.join("uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1]
    filename = f"avatar_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    
    return current_user
