import httpx
from config import settings


def sms_demo_mode() -> bool:
    """True, если реальный SMS-шлюз не настроен"""
    return not settings.SMS_API_KEY


def send_sms_code(phone: str, code: str) -> bool:
    if not settings.SMS_API_KEY:
        print(f"\n{'='*50}")
        print(f"📱 SMS VERIFICATION (fallback)")
        print(f"📞 Phone: {phone}")
        print(f"🔑 Code: {code}")
        print(f"{'='*50}\n")
        return True

    try:
        clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "").replace("(", "").replace(")", "")

        message = f"ФРИПЕТ: Ваш код верификации: {code}. Действителен 5 минут."

        with httpx.Client(timeout=15) as client:
            resp = client.get("https://sms.ru/sms/send", params={
                "api_id": settings.SMS_API_KEY,
                "to": clean_phone,
                "msg": message,
                "json": 1,
            })
            data = resp.json()

            if data.get("status") == "OK":
                print(f"[SMS] Код отправлен на {phone}")
                return True
            else:
                print(f"[SMS ERROR] {data}")
                print(f"[SMS FALLBACK] Код для {phone}: {code}")
                return False

    except Exception as e:
        print(f"[SMS ERROR] {e}")
        print(f"[SMS FALLBACK] Код для {phone}: {code}")
        return False
