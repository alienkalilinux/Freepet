import httpx
from config import settings

MAILRU_AUTHORIZE_URL = "https://oauth.mail.ru/login"
MAILRU_TOKEN_URL = "https://oauth.mail.ru/token"
MAILRU_USER_URL = "https://oauth.mail.ru/userinfo"


def mailru_demo_mode() -> bool:
    """True, если приложение Mail.ru не настроено — включён локальный демо-вход"""
    return not (settings.MAILRU_CLIENT_ID and settings.MAILRU_CLIENT_SECRET)


def get_mailru_demo_auth_url(state: str, backend_base: str) -> str:
    """Локальная страница «Mail.ru» для демо-входа (без интернета)"""
    return f"{backend_base}/api/auth/mailru/demo/authorize?state={state}"


def get_mailru_auth_url(state: str) -> str:
    return (
        f"{MAILRU_AUTHORIZE_URL}"
        f"?client_id={settings.MAILRU_CLIENT_ID}"
        f"&redirect_uri={settings.MAILRU_REDIRECT_URI}"
        f"&response_type=code"
        f"&state={state}"
    )


async def exchange_mailru_code(code: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(MAILRU_TOKEN_URL, data={
                "client_id": settings.MAILRU_CLIENT_ID,
                "client_secret": settings.MAILRU_CLIENT_SECRET,
                "redirect_uri": settings.MAILRU_REDIRECT_URI,
                "code": code,
                "grant_type": "authorization_code",
            })
            data = resp.json()
            if "access_token" not in data:
                return None
            return data
    except Exception:
        return None


async def get_mailru_user(access_token: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(MAILRU_USER_URL, params={
                "access_token": access_token,
            })
            data = resp.json()
            if "id" not in data:
                return None
            return data
    except Exception:
        return None
