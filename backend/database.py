from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from sqlalchemy.engine import make_url
from config import settings


def _build_engine():
    url = make_url(settings.DATABASE_URL)
    connect_args = {}
    if url.get_backend_name().startswith("postgresql"):
        query = dict(url.query or {})
        sslmode = query.pop("sslmode", None)
        query.pop("channel_binding", None)
        url = url.set(query=query)
        if sslmode and sslmode != "disable":
            connect_args["ssl"] = sslmode
        # Отключаем кэш prepared-планов asyncpg: после ALTER (миграций) планы
        # инвалидируются и валят запросы (InvalidCachedStatementError)
        connect_args["statement_cache_size"] = 0
    return create_async_engine(url, echo=False, connect_args=connect_args)


engine = _build_engine()
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def _alter_column_type(conn, table: str, column: str):
    """PG: перевод колонки в TIMESTAMP WITH TIME ZONE (идемпотентно)."""
    await conn.execute(text(
        f"ALTER TABLE {table} ALTER COLUMN {column} TYPE TIMESTAMP WITH TIME ZONE"
    ))


async def init_db():
    async with engine.begin() as conn:
        if settings.DATABASE_URL.startswith("postgresql"):
            # Сначала создаём отсутствующие таблицы
            await conn.run_sync(Base.metadata.create_all)
            # Миграция типов дат для уже существующих таблиц
            for table, column in [
                ("users", "created_at"),
                ("users", "verification_code_expires_at"),
                ("pets", "created_at"),
                ("bookings", "created_at"),
                ("messages", "created_at"),
                ("reports", "created_at"),
                ("user_reports", "created_at"),
            ]:
                try:
                    await _alter_column_type(conn, table, column)
                except Exception:
                    pass
            return
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
