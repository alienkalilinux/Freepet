from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User, Pet, Booking
from schemas import BookingResponse, PetResponse, UserResponse
from auth import get_current_user

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def serialize_booking(booking, pet=None, owner=None):
    data = {
        "id": booking.id,
        "pet_id": booking.pet_id,
        "user_id": booking.user_id,
        "status": booking.status,
        "created_at": booking.created_at,
    }
    if pet:
        pet_data = {
            "id": pet.id,
            "user_id": pet.user_id,
            "name": pet.name,
            "species": pet.species,
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
            "owner": None,
        }
        if owner:
            pet_data["owner"] = {
                "id": owner.id,
                "username": owner.username,
                "email": owner.email,
                "is_blocked": owner.is_blocked,
                "is_verified": owner.is_verified,
                "is_admin": owner.is_admin,
                "created_at": owner.created_at,
            }
        data["pet"] = pet_data
    else:
        data["pet"] = None
    return data


@router.post("", response_model=BookingResponse)
async def create_booking(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    
    if pet.moderation_status != "approved":
        raise HTTPException(status_code=400, detail="Питомец еще не прошел модерацию")
    
    if pet.status == "booked":
        raise HTTPException(status_code=400, detail="Питомец уже забронирован")
    
    if pet.status == "transferred":
        raise HTTPException(status_code=400, detail="Питомец уже передан")
    
    if pet.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя забронировать своего питомца")
    
    existing = await db.execute(
        select(Booking).where(
            Booking.pet_id == pet_id,
            Booking.user_id == current_user.id,
            Booking.status == "active"
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Вы уже забронировали этого питомца")
    
    booking = Booking(
        pet_id=pet_id,
        user_id=current_user.id,
        status="active"
    )
    db.add(booking)
    
    pet.status = "booked"
    
    await db.commit()
    await db.refresh(booking)
    
    owner_result = await db.execute(select(User).where(User.id == pet.user_id))
    owner = owner_result.scalar_one_or_none()
    
    return serialize_booking(booking, pet, owner)


@router.get("/my", response_model=list[BookingResponse])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Booking).where(
            Booking.user_id == current_user.id,
            Booking.status == "active"
        ).order_by(Booking.created_at.desc())
    )
    bookings = result.scalars().all()
    
    response = []
    for booking in bookings:
        pet_result = await db.execute(select(Pet).where(Pet.id == booking.pet_id))
        pet = pet_result.scalar_one_or_none()
        owner = None
        if pet:
            owner_result = await db.execute(select(User).where(User.id == pet.user_id))
            owner = owner_result.scalar_one_or_none()
        response.append(serialize_booking(booking, pet, owner))
    
    return response


@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Booking).where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет прав на отмену этого бронирования")
    
    if booking.status != "active":
        raise HTTPException(status_code=400, detail="Бронирование уже отменено")
    
    pet_result = await db.execute(select(Pet).where(Pet.id == booking.pet_id))
    pet = pet_result.scalar_one_or_none()
    
    if pet:
        pet.status = "available"
    
    booking.status = "cancelled"
    
    await db.commit()
    
    return {"message": "Бронирование отменено"}
