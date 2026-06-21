from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
import time

from app.schemas.schemas import MessageRequest, MessageResponse, ChatHistoryItem, ChatJunctionData
from app.services.gemini import gemini_agent
from app.db.session import get_db
from app.db.models import Junction, TrafficReading

router = APIRouter(prefix="/chat", tags=["Chat"])

# Simple in-memory session history database
SESSION_HISTORIES: Dict[str, List[Dict[str, Any]]] = {}

def get_current_time_str() -> str:
    return datetime.utcnow().strftime("%I:%M %p")

from datetime import datetime

@router.post("/message", response_model=MessageResponse)
async def send_chat_message(req: MessageRequest, db = Depends(get_db)):
    """
    Send a conversational message to the AI Traffic Copilot and receive a context-aware response.
    Supports English, Hindi, and Kannada.
    """
    session_id = req.session_id or "default-session"
    
    # Process query
    result = gemini_agent.run_query(req.message)
    
    # Store message history
    if session_id not in SESSION_HISTORIES:
        # Initialize with starter message
        SESSION_HISTORIES[session_id] = [
            {
                "id": "c0",
                "role": "ai",
                "content": "Namaskara! I am AI Traffic Copilot for Bengaluru Smart City. I can provide real-time junction status, traffic predictions, incident reports, and signal recommendations. How can I assist you today?",
                "timestamp": get_current_time_str(),
                "confidence": 98.0
            }
        ]
        
    # Append user message
    user_msg_id = f"user-{int(time.time() * 1000)}"
    user_msg = {
        "id": user_msg_id,
        "role": "user",
        "content": req.message,
        "timestamp": get_current_time_str()
    }
    SESSION_HISTORIES[session_id].append(user_msg)
    
    # Check if a junction was mentioned in the response to populate junctionData
    junction_data = None
    lower_res = result["content"].lower()
    
    # Query database to find if any junction ID is in the response text
    junctions = db.query(Junction).all()
    for j in junctions:
        norm_name = j.name.lower().replace("junction", "").replace("bridge", "").replace("flyover", "").strip()
        if j.id in lower_res or norm_name in lower_res:
            latest = db.query(TrafficReading).filter(
                TrafficReading.junction_id == j.id
            ).order_by(TrafficReading.time.desc()).first()
            
            density = latest.density_pct if latest else 50.0
            
            level = "LOW"
            if density >= 85.0: level = "CRITICAL"
            elif density >= 70.0: level = "HIGH"
            elif density >= 45.0: level = "MEDIUM"
            
            junction_data = ChatJunctionData(
                name=j.name,
                density=density,
                level=level
            )
            break
            
    # Append AI message
    ai_msg_id = f"ai-{int(time.time() * 1000)}"
    ai_msg = {
        "id": ai_msg_id,
        "role": "ai",
        "content": result["content"],
        "timestamp": get_current_time_str(),
        "confidence": result["confidence"],
        "junctionData": junction_data.dict() if junction_data else None
    }
    SESSION_HISTORIES[session_id].append(ai_msg)
    
    return MessageResponse(
        content=result["content"],
        confidence=result["confidence"],
        language=result["language"],
        junctionData=junction_data
    )

@router.get("/history/{session_id}", response_model=List[ChatHistoryItem])
async def get_chat_history(session_id: str):
    """
    Get conversation message history list for a specific chat session.
    """
    if session_id not in SESSION_HISTORIES:
        # Return default history if session not found
        return [
            ChatHistoryItem(
                id="c0",
                role="ai",
                content="Namaskara! I am AI Traffic Copilot for Bengaluru Smart City. I can provide real-time junction status, traffic predictions, incident reports, and signal recommendations. How can I assist you today?",
                timestamp=get_current_time_str(),
                confidence=98.0
            )
        ]
        
    return SESSION_HISTORIES[session_id]
