from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from database import init_db, async_session
from routers import auth, pets, bookings, admin, messages
from config import settings
import os
from sqlalchemy import select
from models import User
from auth import get_password_hash


async def create_admin_user():
    async with async_session() as db:
        result = await db.execute(select(User).where(User.username == settings.ADMIN_USERNAME))
        if not result.scalar_one_or_none():
            admin_user = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                is_verified=True,
                is_admin=True
            )
            db.add(admin_user)
            await db.commit()
            print(f"Admin user created: {settings.ADMIN_USERNAME}")


async def create_test_user():
    async with async_session() as db:
        result = await db.execute(select(User).where(User.username == settings.TEST_USERNAME))
        if not result.scalar_one_or_none():
            test_user = User(
                username=settings.TEST_USERNAME,
                email=settings.TEST_EMAIL,
                password_hash=get_password_hash(settings.TEST_PASSWORD),
                is_verified=True
            )
            db.add(test_user)
            await db.commit()
            print(f"Test user created: {settings.TEST_USERNAME}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await create_admin_user()
    await create_test_user()
    yield


app = FastAPI(
    title="ФРИПЕТ API",
    description="API для платформы передачи животных",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.FRONTEND_ORIGIN.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

app.include_router(auth.router)
app.include_router(pets.router)
app.include_router(bookings.router)
app.include_router(admin.router)
app.include_router(messages.router)


@app.get("/")
async def root():
    return {"message": "ФРИПЕТ API - Платформа для передачи животных"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
