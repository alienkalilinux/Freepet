from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User, Pet, Booking
from schemas import UserResponse, UpdateProfile
from auth import get_current_user
from config import settings
import os
import uuid

router = APIRouter(prefix="/api/account", tags=["account"])

UPLOAD_DIR = os.path.join(settings.UPLOAD_DIR, "avatars")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED = {"jpg", "jpeg", "png", "gif", "webp"}


def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "phone": u.phone,
        "city": u.city,
        "bio": u.bio,
        "avatar_url": u.avatar_url,
        "is_blocked": u.is_blocked,
        "is_verified": u.is_verified,
        "is_admin": u.is_admin,
        "oauth_provider": u.oauth_provider,
        "created_at": u.created_at,
    }


def _pet_dict(pet: Pet, owner: User | None = None) -> dict:
    data = {
        "id": pet.id,
        "user_id": pet.user_id,
        "name": pet.name,
        "species": pet.species,
        "breed": pet.breed,
        "character": pet.character,
        "city": pet.city,
        "age": pet.age,
        "description": pet.description,
        "vaccination_info": pet.vaccination_info,
        "health_issues": pet.health_issues,
        "documents": pet.documents,
        "image_url": pet.image_url,
        "status": pet.status,
        "moderation_status": pet.moderation_status,
        "rejection_reason": pet.rejection_reason,
        "created_at": pet.created_at,
        "owner": _user_dict(owner) if owner else None,
    }
    return data


def _booking_dict(booking: Booking, pet: Pet | None, owner: User | None, buyer: User | None = None) -> dict:
    data = {
        "id": booking.id,
        "pet_id": booking.pet_id,
        "user_id": booking.user_id,
        "status": booking.status,
        "created_at": booking.created_at,
        "pet": _pet_dict(pet, owner) if pet else None,
    }
    if buyer:
        data["buyer"] = _user_dict(buyer)
    return data


async def _get_user_obj(db: AsyncSession, user_id: int) -> User | None:
    return (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: UpdateProfile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.username is not None:
        new_name = data.username.strip()
        if new_name != current_user.username:
            existing = (await db.execute(select(User).where(User.username == new_name))).scalar_one_or_none()
            if existing:
                raise HTTPException(status_code=400, detail="Это имя пользователя уже занято")
        current_user.username = new_name

    if data.city is not None:
        current_user.city = data.city.strip() or None

    if data.bio is not None:
        current_user.bio = data.bio.strip() or None

    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/avatar", response_model=UserResponse)
async def upload_avatar(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if image.size and image.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"Размер файла не должен превышать {settings.MAX_FILE_SIZE // (1024 * 1024)} МБ")

    ext = (image.filename or "").rsplit(".", 1)[-1].lower() if image.filename else ""
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail=f"Недопустимый формат. Разрешены: {', '.join(sorted(ALLOWED))}")

    if current_user.avatar_url:
        old = os.path.join(settings.UPLOAD_DIR, os.path.basename(current_user.avatar_url))
        if os.path.isfile(old):
            try:
                os.remove(old)
            except OSError:
                pass

    content = await image.read()
    filename = f"{uuid.uuid4()}.{ext}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(content)

    current_user.avatar_url = f"/uploads/avatars/{filename}"
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.get("/bookings")
async def my_booking_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking).where(Booking.user_id == current_user.id).order_by(Booking.created_at.desc())
    )
    bookings = result.scalars().all()

    items = []
    for b in bookings:
        pet = (await db.execute(select(Pet).where(Pet.id == b.pet_id))).scalar_one_or_none()
        owner = await _get_user_obj(db, pet.user_id) if pet else None
        items.append(_booking_dict(b, pet, owner))
    return items


@router.get("/deals")
async def my_deal_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking)
        .join(Pet, Booking.pet_id == Pet.id)
        .where(Pet.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
    )
    bookings = result.scalars().all()

    items = []
    for b in bookings:
        pet = (await db.execute(select(Pet).where(Pet.id == b.pet_id))).scalar_one_or_none()
        buyer = await _get_user_obj(db, b.user_id)
        items.append(_booking_dict(b, pet, current_user, buyer))
    return items
