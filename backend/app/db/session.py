from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine
from backend.app.config import settings

# Determine if we're using SQLite (e.g. for testing)
IS_SQLITE = settings.DATABASE_URL.startswith("sqlite")

# Async engine setup
connect_args = {}
if IS_SQLITE:
    connect_args["check_same_thread"] = False

engine = create_async_engine(settings.DATABASE_URL, connect_args=connect_args)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)

# Sync engine setup
sync_connect_args = {}
is_sync_sqlite = settings.DATABASE_SYNC_URL.startswith("sqlite")
if is_sync_sqlite:
    sync_connect_args["check_same_thread"] = False

sync_engine = create_engine(settings.DATABASE_SYNC_URL, connect_args=sync_connect_args)
SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    expire_on_commit=False
)

Base = declarative_base()

def get_db():
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()

def get_sync_db():
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()
