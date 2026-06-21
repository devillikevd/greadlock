import json
import logging
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as async_redis

from backend.app.config import settings
from backend.app.db.session import SyncSessionLocal
from backend.app.routers import auth, junctions, incidents, recommendations, signals, emergency, analytics, chat, video
from backend.app.services.prediction import prediction_service

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan handler. Triggers training of XGBoost + Prophet models
    on historical database readings during server start.
    """
    logger.info("FastAPI server starting. Initializing AI Prediction models...")
    db = SyncSessionLocal()
    try:
        # Startup training is disabled on lower-memory hosts to reduce RAM usage.
        # Models will be trained lazily when actual prediction requests are processed.
        logger.info("Skipping startup ML training to reduce memory usage on constrained hosts.")
    except Exception as e:
        logger.error(f"Error during startup initialization: {e}")
    finally:
        db.close()
        
    yield
    logger.info("FastAPI server shutting down.")

# FastAPI Init
app = FastAPI(
    title="AI Traffic Copilot API",
    description="Smart City traffic management backend platform for Bengaluru (REST + WebSockets)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(junctions.router)
app.include_router(incidents.router)
app.include_router(recommendations.router)
app.include_router(signals.router)
app.include_router(emergency.router)
app.include_router(analytics.router)
app.include_router(chat.router)
app.include_router(video.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "AI Traffic Copilot Backend",
        "city": "Bengaluru",
        "documentation": "/docs"
    }

# --- WEBSOCKET CONNECTION MANAGER ---
@app.websocket("/ws/{junction_id}")
async def websocket_endpoint(websocket: WebSocket, junction_id: str):
    """
    WebSocket endpoint for real-time traffic updates, immediate incidents,
    and recommendation alerts. Subscribes to Redis Pub/Sub.
    """
    await websocket.accept()
    logger.info(f"WebSocket client connected for junction: {junction_id}")
    
    # Try connecting to Redis for real-time pubsub stream
    try:
        r_client = async_redis.from_url(settings.REDIS_URL)
        pubsub = r_client.pubsub()
        
        # Subscribe to:
        # 1. Junction-specific updates
        # 2. City-wide incident alerts
        # 3. Dynamic AI recommendation alerts
        await pubsub.subscribe(
            f"traffic_channel:{junction_id}",
            "traffic_channel:incidents",
            "traffic_channel:recommendations"
        )
        
        # Start reading messages
        try:
            while True:
                # Poll pubsub with a timeout to keep loop responsive
                msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.5)
                if msg and msg["type"] == "message":
                    payload = json.loads(msg["data"])
                    await websocket.send_json(payload)
                
                # Check if client disconnected by attempting a clean ping read
                # wait_for detects if client closed the connection
                try:
                    await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                except asyncio.TimeoutError:
                    pass
                except WebSocketDisconnect:
                    raise WebSocketDisconnect()
                
                await asyncio.sleep(0.05)
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket client disconnected for junction: {junction_id}")
        finally:
            await pubsub.unsubscribe()
            await r_client.close()
            
    except Exception as e:
        logger.warning(f"Redis not available for WebSockets: {e}. Falling back to active DB simulator.")
        # Fallback loop: queries the database and generates periodic simulated readings
        from backend.seed import generate_reading
        
        db = SyncSessionLocal()
        from backend.app.db.models import Junction
        j = db.query(Junction).filter(Junction.id == junction_id).first()
        capacity = j.road_capacity if j else 2000
        db.close()
        
        try:
            while True:
                now = datetime.utcnow()
                sim_read = generate_reading(now, junction_id, capacity)
                
                level = "LOW"
                if sim_read["density_pct"] >= 85: level = "CRITICAL"
                elif sim_read["density_pct"] >= 70: level = "HIGH"
                elif sim_read["density_pct"] >= 45: level = "MEDIUM"
                
                payload = {
                    "type": "traffic_update",
                    "junction_id": junction_id,
                    "density_pct": sim_read["density_pct"],
                    "vehicle_count": sim_read["vehicle_count"],
                    "avg_speed": sim_read["avg_speed"],
                    "trend": "stable",
                    "status": level,
                    "timestamp": now.isoformat()
                }
                
                await websocket.send_json(payload)
                
                # Sleep in increments of 1s to detect client disconnect quickly
                for _ in range(15):
                    try:
                        await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                    except asyncio.TimeoutError:
                        pass
                    except WebSocketDisconnect:
                        raise WebSocketDisconnect()
                        
        except WebSocketDisconnect:
            logger.info(f"WebSocket client disconnected for junction: {junction_id}")
