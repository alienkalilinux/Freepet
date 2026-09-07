from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import re
import secrets
from database import get_db
from models import User
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    VerifyCode, ChangeEmail, UpdateCity, SendPhoneCode, VerifyPhone,
    OAuthLogin,
)
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from services.email import send_verification_email
from services.sms import send_sms_code
from services.verification import (
    create_code_with_expiry, create_sms_code_with_expiry, verify_code,
)
from services.mailru import get_mailru_auth_url, exchange_mailru_code, get_mailru_user
from config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

PRIMITIVES = [
    '123456', 'password', 'qwerty', 'abc123', 'letmein', 'admin',
    'welcome', 'monkey', 'master', 'dragon', 'login', 'princess',
    'football', 'shadow', 'sunshine', 'trustno1', 'iloveyou',
    '1234567', '12345678', '123456789', '12345', '1234',
    'passw0rd', 'password1', 'qwerty123', '1q2w3e4r', 'azerty',
]


def validate_password(password: str) -> str | None:
    if len(password) < 6:
        return "Пароль должен содержать минимум 6 символов"
    if not re.search(r'[A-Z]', password):
        return "Пароль должен содержать хотя бы одну заглавную букву"
    if not re.search(r'[a-z]', password):
        return "Пароль должен содержать хотя бы одну строчную букву"
    if not re.search(r'[0-9]', password):
        return "Пароль должен содержать хотя бы одну цифру"
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?`~]', password):
        return "Пароль должен содержать хотя бы один спецсимвол"
    lower = password.lower()
    for p in PRIMITIVES:
        if p in lower:
            return "Пароль слишком простой. Используйте более сложный пароль"
    return None


async def _find_or_create_oauth_user(
    db: AsyncSession,
    provider: str,
    provider_id: str,
    username: str,
    email: str,
) -> tuple[User, bool]:
    result = await db.execute(select(User).where(User.oauth_provider == provider, User.oauth_id == str(provider_id)))
    user = result.scalar_one_or_none()
    if user:
        return user, False

    base_username = username
    counter = 1
    while True:
        result = await db.execute(select(User).where(User.username == username))
        if not result.scalar_one_or_none():
            break
        username = f"{base_username}_{counter}"
        counter += 1

    user = User(
        username=username,
        email=email,
        password_hash=get_password_hash(secrets.token_urlsafe(16)),
        oauth_provider=provider,
        oauth_id=str(provider_id),
        is_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user, True


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    password_error = validate_password(user_data.password)
    if password_error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=password_error)

    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Пользователь с таким именем уже существует")

    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Пользователь с таким email уже существует")

    if user_data.phone:
        result = await db.execute(select(User).where(User.phone == user_data.phone))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Пользователь с таким телефоном уже существует")

    hashed_code, raw_code, expires_at = create_code_with_expiry()

    user = User(
        username=user_data.username,
        email=user_data.email,
        phone=user_data.phone,
        city=user_data.city,
        password_hash=get_password_hash(user_data.password),
        verification_code=hashed_code,
        verification_code_expires_at=expires_at,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    send_verification_email(user_data.email, raw_code)

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/verify")
async def verify_email(
    verify_data: VerifyCode,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Аккаунт уже верифицирован")

    ok, msg = verify_code(current_user.verification_code, verify_data.code, current_user.verification_code_expires_at)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    current_user.is_verified = True
    current_user.verification_code = None
    current_user.verification_code_expires_at = None
    await db.commit()
    return {"message": "Аккаунт успешно верифицирован"}


@router.post("/resend-code")
async def resend_code(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Аккаунт уже верифицирован")

    hashed_code, raw_code, expires_at = create_code_with_expiry()
    current_user.verification_code = hashed_code
    current_user.verification_code_expires_at = expires_at
    await db.commit()

    send_verification_email(current_user.email, raw_code)
    return {"message": "Код верификации отправлен"}


@router.post("/change-email")
async def change_email(
    data: ChangeEmail,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя изменить email уже верифицированному аккаунту")

    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Этот email уже используется другим пользователем")

    hashed_code, raw_code, expires_at = create_code_with_expiry()
    current_user.email = data.email
    current_user.verification_code = hashed_code
    current_user.verification_code_expires_at = expires_at
    await db.commit()

    send_verification_email(data.email, raw_code)
    return {"message": f"Новый код отправлен на {data.email}"}


@router.post("/send-phone-code")
async def send_phone_code(
    data: SendPhoneCode,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Аккаунт уже верифицирован")

    try:
        result = await db.execute(
            select(User).where(User.phone == data.phone, User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Этот телефон уже используется другим пользователем")
    except HTTPException:
        raise
    except Exception:
        pass

    try:
        hashed_code, raw_code, expires_at = create_sms_code_with_expiry()
        current_user.phone = data.phone
        current_user.verification_code = hashed_code
        current_user.verification_code_expires_at = expires_at
        await db.commit()

        send_sms_code(data.phone, raw_code)
        return {"message": f"Код отправлен на {data.phone}"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Ошибка отправки SMS: {str(e)}")


@router.post("/verify-phone")
async def verify_phone(
    data: VerifyPhone,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Аккаунт уже верифицирован")

    if not current_user.phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Сначала укажите номер телефона")

    ok, msg = verify_code(current_user.verification_code, data.code, current_user.verification_code_expires_at)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    current_user.is_verified = True
    current_user.verification_code = None
    current_user.verification_code_expires_at = None
    await db.commit()
    return {"message": "Аккаунт успешно верифицирован"}


@router.post("/resend-phone-code")
async def resend_phone_code(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Аккаунт уже верифицирован")

    if not current_user.phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Сначала укажите номер телефона")

    hashed_code, raw_code, expires_at = create_sms_code_with_expiry()
    current_user.verification_code = hashed_code
    current_user.verification_code_expires_at = expires_at
    await db.commit()

    send_sms_code(current_user.phone, raw_code)
    return {"message": f"Новый код отправлен на {current_user.phone}"}


@router.get("/mailru/auth")
async def mailru_auth():
    state = secrets.token_urlsafe(16)
    auth_url = get_mailru_auth_url(state)
    return {"auth_url": auth_url}


@router.get("/mailru/callback")
async def mailru_callback(code: str = "", state: str = "", db: AsyncSession = Depends(get_db)):
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный ответ от Mail.ru")

    token_data = await exchange_mailru_code(code)
    if not token_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Не удалось получить токен Mail.ru")

    mailru_user = await get_mailru_user(token_data["access_token"])
    if not mailru_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Не удалось получить данные из Mail.ru")

    email = mailru_user.get("email", f"mailru_{mailru_user['id']}@mail.ru")
    name = mailru_user.get("name", f"mailru_{mailru_user['id']}")
    username = name.lower().replace(" ", "_")

    user, _ = await _find_or_create_oauth_user(
        db, "mailru", str(mailru_user["id"]),
        username, email,
    )

    access_token = create_access_token(data={"sub": str(user.id)})
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/auth/callback?token={access_token}&user_id={user.id}"
    )


@router.post("/oauth-login", response_model=Token)
async def oauth_login(data: OAuthLogin, db: AsyncSession = Depends(get_db)):
    if data.provider == "mailru":
        mailru_user = await get_mailru_user(data.access_token)
        if not mailru_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Не удалось получить данные из Mail.ru")

        email = mailru_user.get("email", f"mailru_{mailru_user['id']}@mail.ru")
        name = mailru_user.get("name", f"mailru_{mailru_user['id']}")
        username = name.lower().replace(" ", "_")

        user, _ = await _find_or_create_oauth_user(
            db, "mailru", str(mailru_user["id"]),
            username, email,
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Неизвестный провайдер: {data.provider}")

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == login_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверное имя пользователя или пароль")

    if user.is_blocked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ваш аккаунт заблокирован")

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/city", response_model=UserResponse)
async def update_city(
    data: UpdateCity,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.city = data.city.strip()
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)
