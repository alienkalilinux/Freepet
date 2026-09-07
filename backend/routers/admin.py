from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import User, Pet, Booking, Report, UserReport
from schemas import UserResponse, PetResponse
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен. Нужны права администратора.")
    return current_user


@router.get("/stats")
async def get_stats(admin: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    users_count = (await db.execute(select(func.count(User.id)))).scalar()
    pets_count = (await db.execute(select(func.count(Pet.id)))).scalar()
    bookings_count = (await db.execute(select(func.count(Booking.id)))).scalar()
    pending_pets = (await db.execute(
        select(func.count(Pet.id)).where(Pet.moderation_status == "pending")
    )).scalar()
    
    return {
        "users": users_count,
        "pets": pets_count,
        "bookings": bookings_count,
        "pending_moderation": pending_pets
    }


@router.get("/users", response_model=list[UserResponse])
async def list_users(admin: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return [UserResponse.model_validate(u) for u in result.scalars().all()]


@router.get("/pets", response_model=list[PetResponse])
async def list_all_pets(admin: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Pet).order_by(Pet.created_at.desc()))
    pets = result.scalars().all()
    
    pet_responses = []
    for pet in pets:
        owner_result = await db.execute(select(User).where(User.id == pet.user_id))
        owner = owner_result.scalar_one_or_none()
        pet_resp = PetResponse.model_validate(pet)
        if owner:
            from schemas import UserResponse
            pet_resp.owner = UserResponse.model_validate(owner)
        pet_responses.append(pet_resp)
    
    return pet_responses


@router.post("/pets/{pet_id}/approve")
async def approve_pet(
    pet_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    
    pet.moderation_status = "approved"
    pet.status = "available"
    await db.commit()
    return {"message": f"Питомец {pet.name} одобрен"}


@router.post("/pets/{pet_id}/reject")
async def reject_pet(
    pet_id: int,
    reason: str = "Нарушение правил",
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    
    pet.moderation_status = "rejected"
    pet.status = "rejected"
    pet.rejection_reason = reason
    await db.commit()
    return {"message": f"Питомец {pet.name} отклонён"}


@router.post("/users/{user_id}/block")
async def block_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Нельзя заблокировать администратора")
    
    user.is_blocked = True
    await db.commit()
    return {"message": f"Пользователь {user.username} заблокирован"}


@router.post("/users/{user_id}/unblock")
async def unblock_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user.is_blocked = False
    await db.commit()
    return {"message": f"Пользователь {user.username} разблокирован"}


@router.delete("/pets/{pet_id}")
async def delete_pet_admin(
    pet_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    
    import os
    from config import settings
    if pet.image_url:
        filepath = os.path.join(settings.UPLOAD_DIR, os.path.basename(pet.image_url))
        if os.path.exists(filepath):
            os.remove(filepath)
    
    from models import Message
    bookings_result = await db.execute(select(Booking).where(Booking.pet_id == pet_id))
    for booking in bookings_result.scalars().all():
        await db.execute(
            select(Message).where(Message.booking_id == booking.id)
        )
        msgs = await db.execute(select(Message).where(Message.booking_id == booking.id))
        for msg in msgs.scalars().all():
            await db.delete(msg)
        await db.delete(booking)
    
    await db.delete(pet)
    await db.commit()
    return {"message": f"Питомец {pet.name} удалён"}


class ComplaintResponse(BaseModel):
    id: int
    type: str
    reporter_id: int
    reporter_username: str
    target_id: int
    target_username: str
    reason: str
    comment: Optional[str] = None
    is_resolved: bool
    created_at: datetime


@router.get("/complaints")
async def get_complaints(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    complaints = []

    from models import Message

    msg_reports = await db.execute(
        select(Report).where(Report.is_resolved == False).order_by(Report.created_at.desc())
    )
    for r in msg_reports.scalars().all():
        reporter = (await db.execute(select(User).where(User.id == r.reporter_id))).scalar_one_or_none()
        msg_obj = (await db.execute(select(Message).where(Message.id == r.message_id))).scalar_one_or_none()
        target_id = msg_obj.sender_id if msg_obj else 0
        target = (await db.execute(select(User).where(User.id == target_id))).scalar_one_or_none()

        complaints.append(ComplaintResponse(
            id=r.id,
            type="message",
            reporter_id=r.reporter_id,
            reporter_username=reporter.username if reporter else "Unknown",
            target_id=target_id,
            target_username=target.username if target else "Unknown",
            reason=r.reason,
            comment=r.comment,
            is_resolved=r.is_resolved,
            created_at=r.created_at,
        ))

    user_reports = await db.execute(
        select(UserReport).where(UserReport.is_resolved == False).order_by(UserReport.created_at.desc())
    )
    for ur in user_reports.scalars().all():
        reporter = (await db.execute(select(User).where(User.id == ur.reporter_id))).scalar_one_or_none()
        target = (await db.execute(select(User).where(User.id == ur.reported_user_id))).scalar_one_or_none()

        complaints.append(ComplaintResponse(
            id=ur.id,
            type="user",
            reporter_id=ur.reporter_id,
            reporter_username=reporter.username if reporter else "Unknown",
            target_id=ur.reported_user_id,
            target_username=target.username if target else "Unknown",
            reason=ur.reason,
            comment=ur.comment,
            is_resolved=ur.is_resolved,
            created_at=ur.created_at,
        ))

    complaints.sort(key=lambda x: x.created_at, reverse=True)
    return complaints


@router.post("/complaints/{complaint_type}/{complaint_id}/resolve")
async def resolve_complaint(
    complaint_type: str,
    complaint_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    if complaint_type == "message":
        result = await db.execute(select(Report).where(Report.id == complaint_id))
        report = result.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=404, detail="Жалоба не найдена")
        report.is_resolved = True
    elif complaint_type == "user":
        result = await db.execute(select(UserReport).where(UserReport.id == complaint_id))
        report = result.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=404, detail="Жалоба не найдена")
        report.is_resolved = True
    else:
        raise HTTPException(status_code=400, detail="Неверный тип жалобы")

    await db.commit()
    return {"message": "Жалоба рассмотрена"}


@router.post("/complaints/{complaint_type}/{complaint_id}/ban")
async def ban_from_complaint(
    complaint_type: str,
    complaint_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    if complaint_type == "message":
        result = await db.execute(select(Report).where(Report.id == complaint_id))
        report = result.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=404, detail="Жалоба не найдена")
        from models import Message
        msg = (await db.execute(select(Message).where(Message.id == report.message_id))).scalar_one_or_none()
        if not msg:
            raise HTTPException(status_code=404, detail="Сообщение не найдено")
        target_id = msg.sender_id
    elif complaint_type == "user":
        result = await db.execute(select(UserReport).where(UserReport.id == complaint_id))
        report = result.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=404, detail="Жалоба не найдена")
        target_id = report.reported_user_id
    else:
        raise HTTPException(status_code=400, detail="Неверный тип жалобы")

    user = (await db.execute(select(User).where(User.id == target_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Нельзя заблокировать администратора")

    user.is_blocked = True
    report.is_resolved = True
    await db.commit()
    return {"message": f"Пользователь {user.username} заблокирован"}
