from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from database import get_db
from models import User, Pet, Booking, Message, Report, UserReport
from schemas import (
    UserResponse, UpdateProfile, UpdateConsents, DeleteAccountRequest,
)
from auth import get_current_user, verify_password
from config import settings
from datetime import datetime, timezone
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
        "marketing_consent": bool(u.marketing_consent),
        "consent_version": u.consent_version,
        "created_at": u.created_at,
    }


def _public_user_dict(u: User | None) -> dict | None:
    """Данные контрагента без email/телефона и служебных полей."""
    if not u:
        return None
    return {
        "id": u.id,
        "username": u.username,
        "city": u.city,
        "avatar_url": u.avatar_url,
        "is_verified": u.is_verified,
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
        "owner": _public_user_dict(owner),
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
        data["buyer"] = _public_user_dict(buyer)
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


@router.put("/consents", response_model=UserResponse)
async def update_consents(
    data: UpdateConsents,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Включение/отключение информационных рассылок. Отписка — в один клик."""
    current_user.marketing_consent = bool(data.marketing_consent)
    current_user.marketing_consent_at = datetime.now(timezone.utc) if data.marketing_consent else None
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.get("/export")
async def export_my_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Экспорт данных пользователя в машиночитаемом виде (право на доступ)."""
    pets = (await db.execute(select(Pet).where(Pet.user_id == current_user.id))).scalars().all()
    bookings = (await db.execute(
        select(Booking).where(Booking.user_id == current_user.id)
    )).scalars().all()
    messages = (await db.execute(
        select(Message).where(
            or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id),
            Message.is_deleted == False,
        )
    )).scalars().all()

    def iso(value):
        return value.isoformat() if value else None

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "profile": _user_dict(current_user),
        "pets": [
            {
                "id": p.id,
                "name": p.name,
                "species": p.species,
                "breed": p.breed,
                "character": p.character,
                "city": p.city,
                "age": p.age,
                "description": p.description,
                "vaccination_info": p.vaccination_info,
                "health_issues": p.health_issues,
                "image_url": p.image_url,
                "status": p.status,
                "moderation_status": p.moderation_status,
                "created_at": iso(p.created_at),
            }
            for p in pets
        ],
        "bookings": [
            {
                "id": b.id,
                "pet_id": b.pet_id,
                "status": b.status,
                "created_at": iso(b.created_at),
            }
            for b in bookings
        ],
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "receiver_id": m.receiver_id,
                "booking_id": m.booking_id,
                "text": m.text,
                "created_at": iso(m.created_at),
            }
            for m in messages
        ],
    }


@router.delete("")
async def delete_my_account(
    data: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Полное удаление аккаунта и связанных данных по запросу пользователя."""
    if current_user.is_admin:
        raise HTTPException(
            status_code=400,
            detail="Аккаунт администратора нельзя удалить через сайт. Обратитесь к владельцу платформы.",
        )

    if not verify_password(data.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный пароль")

    uid = current_user.id

    # 1. Питомцы пользователя и связанные заявки/сообщения.
    pets = (await db.execute(select(Pet).where(Pet.user_id == uid))).scalars().all()
    pet_ids = [p.id for p in pets]

    bookings = []
    if pet_ids:
        bookings.extend((await db.execute(
            select(Booking).where(Booking.pet_id.in_(pet_ids))
        )).scalars().all())
    bookings.extend((await db.execute(
        select(Booking).where(Booking.user_id == uid)
    )).scalars().all())
    # Убираем дубли (бронь на своего питомца).
    unique_bookings = {b.id: b for b in bookings}
    bookings = list(unique_bookings.values())
    booking_ids = list(unique_bookings.keys())

    # Освобождаем чужие анкеты, на которые пользователь отправил заявку.
    for booking in bookings:
        if booking.user_id == uid and booking.status == "active":
            pet = (await db.execute(select(Pet).where(Pet.id == booking.pet_id))).scalar_one_or_none()
            if pet and pet.status == "booked":
                pet.status = "available"

    # 2. Сообщения пользователя и сообщения по его заявкам.
    message_conditions = [or_(Message.sender_id == uid, Message.receiver_id == uid)]
    if booking_ids:
        message_conditions.append(Message.booking_id.in_(booking_ids))
    messages = (await db.execute(select(Message).where(or_(*message_conditions)))).scalars().all()
    message_ids = [m.id for m in messages]

    # 3. Жалобы, ссылающиеся на удаляемые сообщения или пользователя.
    if message_ids:
        reports = (await db.execute(select(Report).where(Report.message_id.in_(message_ids)))).scalars().all()
        for report in reports:
            await db.delete(report)
    reports_by_user = (await db.execute(select(Report).where(Report.reporter_id == uid))).scalars().all()
    for report in reports_by_user:
        await db.delete(report)
    user_reports = (await db.execute(
        select(UserReport).where(or_(UserReport.reporter_id == uid, UserReport.reported_user_id == uid))
    )).scalars().all()
    for report in user_reports:
        await db.delete(report)

    # 4. Сообщения, заявки, питомцы и файлы.
    for message in messages:
        await db.delete(message)
    for booking in bookings:
        await db.delete(booking)

    for pet in pets:
        if pet.image_url:
            filepath = os.path.join(settings.UPLOAD_DIR, os.path.basename(pet.image_url))
            if os.path.isfile(filepath):
                try:
                    os.remove(filepath)
                except OSError:
                    pass
        await db.delete(pet)

    # 5. Аватар и сама учётная запись.
    if current_user.avatar_url:
        avatar_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(current_user.avatar_url))
        if os.path.isfile(avatar_path):
            try:
                os.remove(avatar_path)
            except OSError:
                pass

    await db.delete(current_user)
    await db.commit()

    return {
        "message": "Аккаунт и связанные данные удалены",
        "deleted_at": datetime.now(timezone.utc).isoformat(),
    }
