from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
import re
import secrets
import urllib.parse
import asyncio
from database import get_db
from models import User
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    VerifyCode, ChangeEmail, UpdateCity, SendPhoneCode, VerifyPhone,
    OAuthLogin,
)
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from services.email import send_verification_email, email_demo_mode
from services.sms import send_sms_code, sms_demo_mode
from services.verification import (
    create_code_with_expiry, create_sms_code_with_expiry, verify_code,
)
from services.mailru import (
    get_mailru_auth_url, exchange_mailru_code, get_mailru_user,
    mailru_demo_mode, get_mailru_demo_auth_url,
)
from config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

async def _run_in_background(func, *args):
    asyncio.create_task(asyncio.to_thread(func, *args))


def _backend_base(request: Request) -> str:
    """Строит base URL бэкенда из Host запроса — работает и на localhost, и по LAN"""
    host = request.headers.get("host", "localhost:8000")
    return f"http://{host}"


def _frontend_url(request: Request) -> str:
    """Base URL фронтенда (порт 3000) — выводится из Host запроса"""
    host = request.headers.get("host", "localhost:3000")
    host = host.replace(":8000", ":3000")
    return f"http://{host}"


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
    try:
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user, True
    except IntegrityError:
        # email уже занят обычным пользователем — используем уникальный email от провайдера
        await db.rollback()
        user.email = f"mailru_{str(provider_id).lower()}@mail.ru"
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

    await _run_in_background(send_verification_email, user_data.email, raw_code)

    demo_code = None
    if email_demo_mode():
        demo_code = raw_code
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        demo_code=demo_code,
        demo_hint="Почта не настроена — код показан на экране (демо-режим)",
    )


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

    await _run_in_background(send_verification_email, current_user.email, raw_code)
    resp = {"message": "Код верификации отправлен"}
    if email_demo_mode():
        resp["demo_code"] = raw_code
        resp["demo_hint"] = "Почта не настроена — код показан на экране (демо-режим)"
    return resp


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

    await _run_in_background(send_verification_email, data.email, raw_code)
    resp = {"message": f"Новый код отправлен на {data.email}"}
    if email_demo_mode():
        resp["demo_code"] = raw_code
        resp["demo_hint"] = "Почта не настроена — код показан на экране (демо-режим)"
    return resp


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

        await _run_in_background(send_sms_code, data.phone, raw_code)
        resp = {"message": f"Код отправлен на {data.phone}"}
        if sms_demo_mode():
            resp["demo_code"] = raw_code
            resp["demo_hint"] = "SMS-шлюз не настроен — код показан на экране (демо-режим)"
        return resp
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

    await _run_in_background(send_sms_code, current_user.phone, raw_code)
    resp = {"message": f"Новый код отправлен на {current_user.phone}"}
    if sms_demo_mode():
        resp["demo_code"] = raw_code
        resp["demo_hint"] = "SMS-шлюз не настроен — код показан на экране (демо-режим)"
    return resp


@router.get("/mailru/auth")
async def mailru_auth(request: Request):
    state = secrets.token_urlsafe(16)
    if mailru_demo_mode():
        backend_base = _backend_base(request)
        return {
            "auth_url": get_mailru_demo_auth_url(state, backend_base),
            "mode": "demo",
            "demo_email": "demo@mail.ru",
        }
    auth_url = get_mailru_auth_url(state)
    return {"auth_url": auth_url, "mode": "live"}


DEMO_AUTHORIZE_PAGE = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Вход через Mail.ru</title>
<style>
  * { box-sizing: border-box; font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
  body { margin: 0; min-height: 100vh; background: #eef1f6; display: flex; flex-direction: column; }
  .card { background: #fff; max-width: 400px; width: 100%; margin: auto; padding: 28px 24px;
          border-radius: 18px; box-shadow: 0 10px 40px rgba(0,0,0,.12); }
  .logo { width: 48px; height: 48px; border-radius: 50%; background: #005ff9; color: #ffcc00;
          font-weight: 800; font-size: 26px; line-height: 48px; text-align: center; margin: 0 auto 8px; }
  h1 { font-size: 20px; text-align: center; color: #1a1a1a; margin: 0 0 4px; }
  .brand { text-align: center; color: #005ff9; font-weight: 700; font-size: 14px; margin-bottom: 18px; letter-spacing: .5px; }
  .demo-note { background: #fff7e6; border: 1px solid #ffd591; color: #8c5a00; font-size: 13px;
               border-radius: 10px; padding: 10px 12px; margin-bottom: 16px; line-height: 1.4; }
  label { display: block; font-size: 13px; color: #555; margin: 10px 0 6px; }
  input { width: 100%; padding: 13px 14px; border: 1px solid #d9d9d9; border-radius: 10px;
          font-size: 16px; background: #fff; min-height: 44px; }
  input:focus { outline: none; border-color: #005ff9; box-shadow: 0 0 0 3px rgba(0,95,249,.15); }
  button { width: 100%; margin-top: 18px; min-height: 48px; border: none; border-radius: 10px;
           background: #005ff9; color: #fff; font-size: 17px; font-weight: 600; cursor: pointer; }
  button:active { background: #0047bb; }
  .hint { text-align: center; color: #999; font-size: 12px; margin-top: 14px; }
</style>
</head>
<body>
  <form class="card" method="post" action="__CONFIRM_URL__">
    <input type="hidden" name="state" value="__STATE__">
    <div class="logo">@</div>
    <h1>Вход через Mail.ru</h1>
    <div class="brand">ФРИПЕТ запрашивает доступ</div>
    <div class="demo-note">Демо-режим: приложение Mail.ru не настроено, поэтому вход выполняется локально,
      без интернета и без данных реального аккаунта.</div>
    <label for="name">Имя пользователя</label>
    <input id="name" name="name" value="demo_user" maxlength="50">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" value="demo@mail.ru" maxlength="100">
    <button type="submit">Войти через Mail.ru</button>
    <div class="hint">Вы сможете менять имя при каждом входе.</div>
  </form>
</body>
</html>"""


@router.get("/mailru/demo/authorize", response_class=HTMLResponse)
async def mailru_demo_authorize(request: Request, state: str = ""):
    return HTMLResponse(
        DEMO_AUTHORIZE_PAGE
        .replace("__CONFIRM_URL__", f"{_backend_base(request)}/api/auth/mailru/demo/confirm")
        .replace("__STATE__", state)
    )


@router.post("/mailru/demo/confirm")
async def mailru_demo_confirm(request: Request):
    form = await request.form()
    state = str(form.get("state") or "")
    name = (str(form.get("name") or "demo_user")).strip() or "demo_user"
    email = (str(form.get("email") or "demo@mail.ru")).strip() or "demo@mail.ru"
    code = f"demo-{state or secrets.token_urlsafe(8)}"
    params = urllib.parse.urlencode({
        "code": code,
        "state": state,
        "demo_name": name,
        "demo_email": email,
    })
    return RedirectResponse(
        url=f"{_backend_base(request)}/api/auth/mailru/callback?{params}",
        status_code=303,
    )


@router.get("/mailru/callback")
async def mailru_callback(request: Request, code: str = "", state: str = "", db: AsyncSession = Depends(get_db)):
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный ответ от Mail.ru")

    if code.startswith("demo-"):
        demo_email = (request.query_params.get("demo_email") or "demo@mail.ru").strip().lower()
        mailru_user = {
            "id": f"mailru-demo-{demo_email}",
            "name": request.query_params.get("demo_name", "demo_user"),
            "email": demo_email,
        }
    else:
        token_data = await exchange_mailru_code(code)
        if not token_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Не удалось получить токен Mail.ru")

        mailru_user = await get_mailru_user(token_data["access_token"])
        if not mailru_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Не удалось получить данные из Mail.ru")

    email = mailru_user.get("email", f"mailru_{mailru_user['id']}@mail.ru")
    name = mailru_user.get("name", f"mailru_{mailru_user['id']}")
    username = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower()).strip('_')
    if not username:
        username = re.sub(r'[^a-zA-Z0-9_]', '_', email.split('@')[0].lower()).strip('_')
    if not username:
        username = f"mailru_{str(mailru_user['id'])[:14].replace('-', '_')}"

    user, _ = await _find_or_create_oauth_user(
        db, "mailru", str(mailru_user["id"]),
        username, email,
    )

    access_token = create_access_token(data={"sub": str(user.id)})
    params = urllib.parse.urlencode({"token": access_token, "user_id": str(user.id)})
    return RedirectResponse(
        url=f"{_frontend_url(request)}/auth/callback?{params}"
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
