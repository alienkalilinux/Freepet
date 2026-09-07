from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from config import settings


engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if settings.DATABASE_URL.startswith("sqlite"):
            # Миграция колонок через PRAGMA работает только для SQLite
            result = await conn.execute(text("PRAGMA table_info(pets)"))
            columns = {row[1] for row in result.fetchall()}
            if "breed" not in columns:
                await conn.execute(text("ALTER TABLE pets ADD COLUMN breed VARCHAR(100)"))
            if "character" not in columns:
                await conn.execute(text("ALTER TABLE pets ADD COLUMN character VARCHAR(100)"))
            if "city" not in columns:
                await conn.execute(text("ALTER TABLE pets ADD COLUMN city VARCHAR(100)"))
            result = await conn.execute(text("PRAGMA table_info(users)"))
            user_columns = {row[1] for row in result.fetchall()}
            if "city" not in user_columns:
                await conn.execute(text("ALTER TABLE users ADD COLUMN city VARCHAR(100)"))
