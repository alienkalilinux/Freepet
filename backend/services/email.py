import random
import string
import secrets
import smtplib
import ssl
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings


def generate_verification_code() -> str:
    """Генерирует безопасный 8-символьный код верификации (буквы + цифры)"""
    chars = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(chars) for _ in range(8))
    return f"{code[:4]}-{code[4:]}"


def _build_html(code: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; border-radius: 15px; text-align: center;">
            <h1 style="color: white; margin: 0;">ФРИПЕТ</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Код верификации</h2>
            <p style="color: #666;">Для завершения регистрации введите этот код на сайте:</p>
            <div style="background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #16a34a; letter-spacing: 5px;">{code}</span>
            </div>
            <p style="color: #999; font-size: 12px;">Код действителен в течение 5 минут.</p>
            <p style="color: #999; font-size: 12px;">Если вы не регистрировались на ФРИПЕТ, просто игнорируйте это письмо.</p>
        </div>
    </div>
    """


def _send_via_brevo(email: str, html: str) -> bool:
    """Отправка через Brevo (Sendinblue) HTTPS API — работает из Render (порт 443)."""
    try:
        resp = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": settings.BREVO_API_KEY,
                "accept": "application/json",
            },
            json={
                "sender": {"email": settings.EMAIL_USER},
                "to": [{"email": email}],
                "subject": "ФРИПЕТ - Код верификации",
                "htmlContent": html,
            },
            timeout=20,
        )
        if resp.status_code < 300:
            print(f"[EMAIL] Письмо отправлено на {email} (Brevo)")
            return True
        print(f"[EMAIL ERROR] Brevo {resp.status_code}: {resp.text[:300]}")
        return False
    except Exception as e:
        print(f"[EMAIL ERROR] Brevo: {e}")
        return False


def _send_via_smtp(email: str, html: str) -> bool:
    """Отправка через Gmail SMTP (обычно работает локально, с Render может быть недоступен)."""
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = email
        msg['Subject'] = "ФРИПЕТ - Код верификации"
        msg.attach(MIMEText(html, 'html'))

        context = ssl.create_default_context()
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=15) as server:
            server.starttls(context=context)
            server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.send_message(msg)

        print(f"[EMAIL] Письмо отправлено на {email} (SMTP)")
        return True

    except smtplib.SMTPAuthenticationError:
        print(f"[EMAIL ERROR] Неверный логин/пароль Gmail")
        return False

    except smtplib.SMTPConnectError:
        print(f"[EMAIL ERROR] Не удалось подключиться к Gmail SMTP")
        return False

    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def send_verification_email(email: str, code: str) -> bool:
    """
    Отправляет письмо с кодом верификации.
    Приоритет: Brevo API -> Gmail SMTP -> вывод кода в консоль.
    """
    if settings.BREVO_API_KEY:
        if _send_via_brevo(email, _build_html(code)):
            return True

    if settings.EMAIL_USER and settings.EMAIL_PASSWORD:
        if _send_via_smtp(email, _build_html(code)):
            return True

    print(f"\n{'='*50}")
    print(f"[VERIFICATION] Код для {email}: {code}")
    print(f"{'='*50}\n")
    return True