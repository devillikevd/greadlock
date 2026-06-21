import pytest
import asyncio
import os
from datetime import datetime
from httpx import AsyncClient, ASGITransport
import bcrypt

# Override env settings BEFORE importing app
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///file:testdb?mode=memory&cache=shared"
os.environ["DATABASE_SYNC_URL"] = "sqlite:///file:testdb?mode=memory&cache=shared"
os.environ["REDIS_URL"] = "redis://localhost:6379/9"
os.environ["GEMINI_API_KEY"] = "mock-key-for-tests"

from backend.app.main import app
from backend.app.db.session import get_db, Base
from backend.app.db.models import User, UserRole, Junction, Officer, TrafficReading
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup sync engine for tests connecting to the shared memory SQLite db
sync_engine = create_engine("sqlite:///file:testdb?mode=memory&cache=shared", connect_args={"check_same_thread": False})
SyncSessionLocal = sessionmaker(bind=sync_engine, expire_on_commit=False)

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

# Setup db before each test runs
@pytest.fixture(autouse=True)
def setup_db():
    # Create tables synchronously
    Base.metadata.drop_all(bind=sync_engine)
    Base.metadata.create_all(bind=sync_engine)
        
    # Seed mock data
    session = SyncSessionLocal()
    try:
        # Mock inspector user
        user = User(
            email="inspector@btp.gov.in",
            role=UserRole.inspector,
            password_hash=hash_password("password123")
        )
        session.add(user)
        
        # Mock public user
        user_pub = User(
            email="public@btp.gov.in",
            role=UserRole.public,
            password_hash=hash_password("password123")
        )
        session.add(user_pub)
        
        # Mock junction
        j = Junction(
            id="silk-board",
            name="Silk Board Junction",
            zone="South Bengaluru",
            lat=12.9175,
            lng=77.6229,
            road_capacity=3000
        )
        session.add(j)
        
        # Mock officer
        o = Officer(
            name="Suresh Kumar",
            rank="Inspector",
            zone="South Bengaluru",
            badge_number="IN-5501",
            mobile="9876543211"
        )
        session.add(o)
        
        session.commit()
        
        # Mock traffic reading
        r = TrafficReading(
            time=datetime.utcnow(),
            junction_id="silk-board",
            vehicle_count=1200,
            density_pct=60.0,
            avg_speed=24.5,
            cars=400,
            bikes=500,
            buses=50,
            trucks=20,
            autos=230,
            pedestrians=80
        )
        session.add(r)
        session.commit()
    finally:
        session.close()

def override_get_db():
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
