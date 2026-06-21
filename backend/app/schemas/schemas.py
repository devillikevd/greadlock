from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional, Dict, Any
from backend.app.db.models import UserRole, IncidentType, Severity, IncidentStatus, RecommendationPriority, RecommendationStatus, SignalMode, CorridorStatus

# --- AUTH SCHEMAS ---
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    name: str

class UserOut(BaseModel):
    id: int
    email: str
    role: UserRole
    class Config:
        from_attributes = True

# --- INCIDENT SCHEMAS ---
class IncidentCreate(BaseModel):
    junction_id: str
    type: IncidentType
    severity: Severity
    description: Optional[str] = None

class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    assigned_officer_id: Optional[int] = None

class IncidentOut(BaseModel):
    id: int
    junction_id: str
    type: IncidentType
    severity: Severity
    status: IncidentStatus
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    assigned_officer_id: Optional[int] = None
    description: Optional[str] = None
    class Config:
        from_attributes = True

# --- JUNCTION SCHEMAS ---
class LaneInfo(BaseModel):
    name: str
    count: int

class ReadingOut(BaseModel):
    time: datetime
    vehicle_count: int
    density_pct: float
    avg_speed: float
    class Config:
        from_attributes = True

class JunctionOut(BaseModel):
    id: str
    name: str
    zone: str
    density: float
    vehicleCount: int
    level: str
    avgSpeed: float
    trend: str
    lastUpdated: str
    lat: float
    lng: float
    class Config:
        from_attributes = True

class JunctionDetailOut(BaseModel):
    id: str
    name: str
    zone: str
    density: float
    vehicleCount: int
    level: str
    avgSpeed: float
    trend: str
    lastUpdated: str
    lat: float
    lng: float
    lanes: List[LaneInfo]
    incidents: List[IncidentOut]
    last_3_hours_readings: List[ReadingOut]

class PredictionHorizon(BaseModel):
    density: float
    confidence: float
    level: str

class PredictionsOut(BaseModel):
    predictions: Dict[str, PredictionHorizon]

# --- RECOMMENDATION SCHEMAS ---
class RecommendationOut(BaseModel):
    id: int
    junction_id: str
    priority: RecommendationPriority
    action_type: str
    action_detail: str
    confidence_score: float
    status: RecommendationStatus
    created_at: datetime
    class Config:
        from_attributes = True

# --- SIGNAL SCHEMAS ---
class SignalTimingOut(BaseModel):
    id: int
    junction_id: str
    north_green: int
    south_green: int
    east_green: int
    west_green: int
    mode: SignalMode
    updated_at: datetime
    class Config:
        from_attributes = True

class SignalOptimizeResult(BaseModel):
    north_green: int
    south_green: int
    east_green: int
    west_green: int
    estimated_wait_reduction_pct: float
    estimated_throughput_gain_pct: float

class SignalSimulateResult(BaseModel):
    fixed: Dict[str, Any]
    ai: Dict[str, Any]
    wait_reduction_pct: float
    throughput_increase_pct: float
    co2_reduction_pct: float

# --- EMERGENCY SCHEMAS ---
class EmergencyCorridorCreate(BaseModel):
    ambulance_id: str
    current_lat: float
    current_lng: float
    destination_junction_id: str

class EmergencyStep(BaseModel):
    junction_id: str
    junction_name: str
    signal_action: str
    eta_seconds: int

class EmergencyCorridorOut(BaseModel):
    corridor_id: int
    route: List[EmergencyStep]
    total_eta_normal: int
    total_eta_optimized: int
    status: str

# --- ANALYTICS SCHEMAS ---
class CitySummaryOut(BaseModel):
    total_vehicles: int
    alerts: int
    avg_speed: float
    resolved_count: int

class JunctionRankingOut(BaseModel):
    junction_id: str
    junction_name: str
    density_pct: float
    severity: str

class EmissionsOut(BaseModel):
    junction_id: str
    junction_name: str
    co2_kg_per_hour: float

# --- CHAT SCHEMAS ---
class ChatJunctionData(BaseModel):
    name: str
    density: float
    level: str

class MessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class MessageResponse(BaseModel):
    content: str
    confidence: float
    language: str
    junctionData: Optional[ChatJunctionData] = None

class ChatHistoryItem(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    confidence: Optional[float] = None
    junctionData: Optional[ChatJunctionData] = None

# --- VIDEO SCHEMAS ---
class VideoAnomaly(BaseModel):
    type: str
    confidence: float
    frame_number: int

class VideoAnalyzeResult(BaseModel):
    frame_count: int
    vehicle_counts: Dict[str, int]
    density_pct: float
    anomalies: List[VideoAnomaly]
    processing_fps: float
