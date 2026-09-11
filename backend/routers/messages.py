from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from database import get_db
from models import Message, Booking, User, Pet, Report, UserReport
from auth import get_current_user

router = APIRouter(prefix="/api/messages", tags=["messages"])

ADMIN_USER_ID = 1

REPORT_REASONS = [
    "Спам", "Оскорбления", "Неприемлемый контент",
    "Мошенничество", "Другое",
]


class MessageCreate(BaseModel):
    receiver_id: int
    booking_id: Optional[int] = None
    text: str = Field(..., min_length=1, max_length=2000)


class ReportCreate(BaseModel):
    message_id: int
    reason: str = Field(..., min_length=1, max_length=100)
    comment: Optional[str] = Field(None, max_length=500)


class UserReportCreate(BaseModel):
    reported_user_id: int
    reason: str = Field(..., min_length=1, max_length=100)
    comment: Optional[str] = Field(None, max_length=500)


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    booking_id: Optional[int]
    text: str
    is_read: bool
    created_at: datetime
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    user_id: int
    username: str
    pet_name: Optional[str] = None
    pet_id: Optional[int] = None
    last_message: str
    last_message_time: datetime
    unread_count: int
    is_admin_chat: bool = False


@router.post("", response_model=MessageResponse)
async def send_message(
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя отправить сообщение самому себе")

    receiver = await db.execute(select(User).where(User.id == data.receiver_id))
    receiver_obj = receiver.scalar_one_or_none()
    if not receiver_obj:
        raise HTTPException(status_code=404, detail="Получатель не найден")

    if data.booking_id:
        booking = await db.execute(select(Booking).where(Booking.id == data.booking_id))
        booking_obj = booking.scalar_one_or_none()
        if not booking_obj:
            raise HTTPException(status_code=404, detail="Бронирование не найдено")

        pet = await db.execute(select(Pet).where(Pet.id == booking_obj.pet_id))
        pet_obj = pet.scalar_one_or_none()
        if pet_obj:
            is_owner = pet_obj.user_id == current_user.id
            is_booker = booking_obj.user_id == current_user.id
            if not is_owner and not is_booker:
                raise HTTPException(status_code=403, detail="Нет доступа к этому чату")

    message = Message(
        sender_id=current_user.id,
        receiver_id=data.receiver_id,
        booking_id=data.booking_id,
        text=data.text,
    )
    db.add(message)

    await db.commit()
    await db.refresh(message)

    return MessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        booking_id=message.booking_id,
        text=message.text,
        is_read=message.is_read,
        created_at=message.created_at,
        sender_name=current_user.username,
    )


@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Message).where(Message.id == message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Сообщение не найдено")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Можно удалять только свои сообщения")
    msg.is_deleted = True
    await db.commit()
    return {"message": "Сообщение удалено"}


@router.post("/report")
async def report_message(
    data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Message).where(Message.id == data.message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Сообщение не найдено")
    if msg.sender_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя пожаловаться на своё сообщение")

    existing = await db.execute(
        select(Report).where(
            Report.reporter_id == current_user.id,
            Report.message_id == data.message_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Вы уже жаловались на это сообщение")

    report = Report(
        reporter_id=current_user.id,
        message_id=data.message_id,
        reason=data.reason,
        comment=data.comment,
    )
    db.add(report)
    await db.commit()
    return {"message": "Жалоба отправлена"}


@router.post("/report-user")
async def report_user(
    data: UserReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.reported_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя пожаловаться на себя")

    reported = await db.execute(select(User).where(User.id == data.reported_user_id))
    if not reported.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    existing = await db.execute(
        select(UserReport).where(
            UserReport.reporter_id == current_user.id,
            UserReport.reported_user_id == data.reported_user_id,
            UserReport.is_resolved == False,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Вы уже жаловались на этого пользователя")

    report = UserReport(
        reporter_id=current_user.id,
        reported_user_id=data.reported_user_id,
        reason=data.reason,
        comment=data.comment,
    )
    db.add(report)
    await db.commit()
    return {"message": "Жалоба на пользователя отправлена"}


@router.get("/unread/count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(func.count(Message.id)).where(
            Message.receiver_id == current_user.id,
            Message.is_read == False,
            Message.is_deleted == False,
        )
    )
    count = result.scalar() or 0
    return {"count": count}


@router.get("/conversations", response_model=list[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Message).where(
            or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id),
            Message.is_deleted == False,
        ).order_by(Message.created_at.desc())
    )
    all_messages = result.scalars().all()

    seen = {}
    for msg in all_messages:
        other_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
        if other_id not in seen:
            seen[other_id] = msg

    conversations = []
    for other_id, last_msg in seen.items():
        user_result = await db.execute(select(User).where(User.id == other_id))
        user = user_result.scalar_one_or_none()
        if not user:
            continue

        pet_name = None
        pet_id = None
        if last_msg.booking_id:
            booking_result = await db.execute(select(Booking).where(Booking.id == last_msg.booking_id))
            booking = booking_result.scalar_one_or_none()
            if booking:
                pet_result = await db.execute(select(Pet).where(Pet.id == booking.pet_id))
                pet = pet_result.scalar_one_or_none()
                if pet:
                    pet_name = pet.name
                    pet_id = pet.id

        unread_result = await db.execute(
            select(func.count(Message.id)).where(
                Message.sender_id == other_id,
                Message.receiver_id == current_user.id,
                Message.is_read == False,
                Message.is_deleted == False,
            )
        )
        unread_count = unread_result.scalar() or 0

        conversations.append(ConversationResponse(
            user_id=user.id,
            username=user.username,
            pet_name=pet_name,
            pet_id=pet_id,
            last_message=last_msg.text,
            last_message_time=last_msg.created_at,
            unread_count=unread_count,
            is_admin_chat=(other_id == ADMIN_USER_ID),
        ))

    has_admin_chat = any(c.is_admin_chat for c in conversations)
    if not has_admin_chat and current_user.id != ADMIN_USER_ID:
        conversations.append(ConversationResponse(
            user_id=ADMIN_USER_ID,
            username="Поддержка",
            last_message="",
            last_message_time=datetime.min.replace(tzinfo=timezone.utc),
            unread_count=0,
            is_admin_chat=True,
        ))

    admin_convs = [c for c in conversations if c.is_admin_chat]
    other_convs = [c for c in conversations if not c.is_admin_chat]
    other_convs.sort(key=lambda x: x.last_message_time, reverse=True)
    admin_convs.sort(key=lambda x: x.last_message_time, reverse=True)
    return admin_convs + other_convs


@router.get("/{user_id}", response_model=list[MessageResponse])
async def get_messages(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Message).where(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
                and_(Message.sender_id == user_id, Message.receiver_id == current_user.id),
            ),
            Message.is_deleted == False,
        ).order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()

    unread_update = await db.execute(
        select(Message).where(
            Message.sender_id == user_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False,
            Message.is_deleted == False,
        )
    )
    for msg in unread_update.scalars().all():
        msg.is_read = True
    await db.commit()

    users_cache = {}
    output = []
    for msg in messages:
        if msg.sender_id not in users_cache:
            r = await db.execute(select(User).where(User.id == msg.sender_id))
            u = r.scalar_one_or_none()
            users_cache[msg.sender_id] = u.username if u else "Unknown"
        if msg.receiver_id not in users_cache:
            r = await db.execute(select(User).where(User.id == msg.receiver_id))
            u = r.scalar_one_or_none()
            users_cache[msg.receiver_id] = u.username if u else "Unknown"

        output.append(MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            receiver_id=msg.receiver_id,
            booking_id=msg.booking_id,
            text=msg.text,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender_name=users_cache[msg.sender_id],
            receiver_name=users_cache[msg.receiver_id],
        ))

    return output
