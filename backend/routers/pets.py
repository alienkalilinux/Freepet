from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Optional
from database import get_db
from models import User, Pet, Booking
from schemas import PetResponse
from auth import get_current_user, get_optional_user
from services.moderation import moderate_pet_content
from config import settings
import os
import uuid

router = APIRouter(prefix="/api/pets", tags=["pets"])

BREED_LISTS = {
    "Собака": ["Немецкая овчарка", "Лабрадор", "Хаски", "Такса", "Бульдог", "Мопс", "Ретривер", "Спаниель", "Терьер", "Ротвейлер", "Доберман", "Шпиц", "Чихуахуа", "Боксёр", "Пудель", "Болонка", "Дворняжка"],
    "Кошка": ["Британская", "Шотландская", "Мейн-кун", "Сиамская", "Персидская", "Русская голубая", "Сибирская", "Бенгальская", "Сфинкс", "Абиссинская", "Бирманская", "Рэгдолл", "Ориентальная", "Тайская", "Дворовая"],
    "Хомяк": ["Сирийский", "Джунгарский", "Кэмпбелла", "Роборовского", "Китайский", "Обыкновенный"],
    "Попугай": ["Волнистый", "Корелла", "Неразлучник", "Ара", "Какаду", "Жако", "Амазон", "Кеа"],
    "Рыбка": ["Гуппи", "Меченосец", "Золотая", "Скалярия", "Барбус", "Неон", "Данио", "Петушок", "Моллинезия", "Сомик", "Тетра"],
    "Черепаха": ["Красноухая", "Среднеазиатская", "Болотная", "Европейская", "Звёздчатая"],
    "Кролик": ["Бельгийский", "Карликовый", "Рекс", "Ангорский", "Калифорнийский", "Баран", "Хотот"],
}

ALL_KNOWN_BREEDS = [b.lower() for breeds in BREED_LISTS.values() for b in breeds]


@router.get("", response_model=list[PetResponse])
async def list_pets(
    species: Optional[str] = None,
    breed: Optional[str] = None,
    character: Optional[str] = None,
    city: Optional[str] = None,
    is_unknown: Optional[bool] = None,
    other_breed: Optional[bool] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Pet).where(Pet.moderation_status == "approved")
    
    unknown_breed_cond = or_(
        Pet.breed.is_(None),
        Pet.breed == "",
        Pet.breed.ilike("%неизвестн%"),
    )

    if species:
        query = query.where(Pet.species == species)
    if city:
        query = query.where(Pet.city.ilike(f"%{city}%"))
    if is_unknown is True:
        query = query.where(unknown_breed_cond)
    elif is_unknown is False:
        query = query.where(~unknown_breed_cond)
    elif other_breed is True:
        query = query.where(
            Pet.breed.isnot(None),
            Pet.breed != "",
            ~Pet.breed.ilike("%неизвестн%"),
        )
    elif breed:
        query = query.where(Pet.breed.ilike(f"%{breed}%"))
    if character:
        query = query.where(Pet.character.ilike(f"%{character}%"))
    if status_filter:
        query = query.where(Pet.status == status_filter)
    if search:
        query = query.where(
            (Pet.name.ilike(f"%{search}%")) |
            (Pet.description.ilike(f"%{search}%")) |
            (Pet.breed.ilike(f"%{search}%"))
        )
    
    query = query.order_by(Pet.created_at.desc())
    result = await db.execute(query)
    pets = list(result.scalars().all())

    if other_breed is True:
        pets = [p for p in pets if (p.breed or "").strip().lower() not in ALL_KNOWN_BREEDS]
    
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


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(pet_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    
    owner_result = await db.execute(select(User).where(User.id == pet.user_id))
    owner = owner_result.scalar_one_or_none()
    
    pet_resp = PetResponse.model_validate(pet)
    if owner:
        from schemas import UserResponse
        pet_resp.owner = UserResponse.model_validate(owner)
    
    return pet_resp


@router.post("", response_model=PetResponse)
async def create_pet(
    name: str = Form(...),
    species: str = Form(...),
    breed: Optional[str] = Form(None),
    character: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    description: str = Form(...),
    vaccination_info: Optional[str] = Form(None),
    health_issues: Optional[str] = Form(None),
    documents: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_verified and not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Для создания анкеты необходимо верифицировать email"
        )

    image_bytes = None
    image_url = None
    
    if image:
        if image.size and image.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Размер файла превышает {settings.MAX_FILE_SIZE // (1024*1024)} МБ"
            )
        
        ext = image.filename.split(".")[-1].lower() if image.filename else ""
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Недопустимый формат файла. Разрешены: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        image_bytes = await image.read()
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        image_url = f"/uploads/{filename}"
    
    text_content = f"{name} {description} {vaccination_info or ''} {health_issues or ''}"
    moderation_result = await moderate_pet_content(
        image_bytes=image_bytes,
        text=text_content,
        name=name,
        species=species
    )
    
    moderation_status = "approved" if moderation_result["approved"] else "rejected"
    rejection_reason = moderation_result.get("reason")
    pet_status = "available" if moderation_result["approved"] else "rejected"
    
    if not moderation_result["approved"]:
        if image_url:
            filepath = os.path.join(settings.UPLOAD_DIR, os.path.basename(image_url))
            if os.path.exists(filepath):
                os.remove(filepath)
    
    pet = Pet(
        user_id=current_user.id,
        name=name,
        species=species,
        breed=breed,
        character=character,
        city=city,
        age=age,
        description=description,
        vaccination_info=vaccination_info,
        health_issues=health_issues,
        documents=documents,
        image_url=image_url,
        status=pet_status,
        moderation_status=moderation_status,
        rejection_reason=rejection_reason
    )
    
    db.add(pet)
    await db.commit()
    await db.refresh(pet)
    
    pet_resp = PetResponse.model_validate(pet)
    from schemas import UserResponse
    pet_resp.owner = UserResponse.model_validate(current_user)
    
    return pet_resp


@router.delete("/{pet_id}")
async def delete_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец не найден")
    
    if pet.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Нет прав на удаление этого питомца")
    
    if pet.image_url:
        filepath = os.path.join(settings.UPLOAD_DIR, os.path.basename(pet.image_url))
        if os.path.exists(filepath):
            os.remove(filepath)
    
    from models import Message
    bookings_result = await db.execute(select(Booking).where(Booking.pet_id == pet_id))
    for booking in bookings_result.scalars().all():
        msgs = await db.execute(select(Message).where(Message.booking_id == booking.id))
        for msg in msgs.scalars().all():
            await db.delete(msg)
        await db.delete(booking)
    
    await db.delete(pet)
    await db.commit()
    
    return {"message": "Питомец удален"}
