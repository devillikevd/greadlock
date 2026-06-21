import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

# Enums matching database design
class UserRole(str, enum.Enum):
    constable = "constable"
    inspector = "inspector"
    acp = "acp"
    commissioner = "commissioner"
    public = "public"

class IncidentType(str, enum.Enum):
    accident = "accident"
    fire = "fire"
    wrong_way = "wrong_way"
    stopped_vehicle = "stopped_vehicle"
    roadblock = "roadblock"

class Severity(str, enum.Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"

class IncidentStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"

class RecommendationPriority(str, enum.Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"

class RecommendationStatus(str, enum.Enum):
    pending = "pending"
    deployed = "deployed"
    dismissed = "dismissed"

class SignalMode(str, enum.Enum):
    fixed = "fixed"
    ai_adaptive = "ai_adaptive"

class CorridorStatus(str, enum.Enum):
    active = "active"
    completed = "completed"

# SQLAlchemy Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.public)

class Officer(Base):
    __tablename__ = "officers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rank = Column(String, nullable=False)
    zone = Column(String, nullable=False)
    badge_number = Column(String, unique=True, nullable=False)
    mobile = Column(String, nullable=False)

class Junction(Base):
    __tablename__ = "junctions"
    id = Column(String, primary_key=True, index=True)  # e.g., "silk-board"
    name = Column(String, nullable=False)
    zone = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    road_capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    readings = relationship("TrafficReading", back_populates="junction", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="junction")
    recommendations = relationship("AIRecommendation", back_populates="junction")
    signals = relationship("SignalTiming", back_populates="junction", uselist=False)

class TrafficReading(Base):
    __tablename__ = "traffic_readings"
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False)
    junction_id = Column(String, ForeignKey("junctions.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    
    vehicle_count = Column(Integer, nullable=False)
    density_pct = Column(Float, nullable=False)
    avg_speed = Column(Float, nullable=False)
    
    # Details per category
    cars = Column(Integer, default=0)
    bikes = Column(Integer, default=0)
    buses = Column(Integer, default=0)
    trucks = Column(Integer, default=0)
    autos = Column(Integer, default=0)
    pedestrians = Column(Integer, default=0)

    junction = relationship("Junction", back_populates="readings")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    junction_id = Column(String, ForeignKey("junctions.id", ondelete="CASCADE"), nullable=False)
    type = Column(SQLEnum(IncidentType), nullable=False)
    severity = Column(SQLEnum(Severity), nullable=False)
    status = Column(SQLEnum(IncidentStatus), nullable=False, default=IncidentStatus.open)
    detected_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    assigned_officer_id = Column(Integer, ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)
    description = Column(String, nullable=True)

    junction = relationship("Junction", back_populates="incidents")
    officer = relationship("Officer")

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    junction_id = Column(String, ForeignKey("junctions.id", ondelete="CASCADE"), nullable=False)
    priority = Column(SQLEnum(RecommendationPriority), nullable=False)
    action_type = Column(String, nullable=False)
    action_detail = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False)
    status = Column(SQLEnum(RecommendationStatus), nullable=False, default=RecommendationStatus.pending)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    junction = relationship("Junction", back_populates="recommendations")

class SignalTiming(Base):
    __tablename__ = "signal_timings"
    id = Column(Integer, primary_key=True, index=True)
    junction_id = Column(String, ForeignKey("junctions.id", ondelete="CASCADE"), unique=True, nullable=False)
    north_green = Column(Integer, nullable=False, default=30)
    south_green = Column(Integer, nullable=False, default=30)
    east_green = Column(Integer, nullable=False, default=30)
    west_green = Column(Integer, nullable=False, default=30)
    mode = Column(SQLEnum(SignalMode), nullable=False, default=SignalMode.fixed)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    junction = relationship("Junction", back_populates="signals")

class EmergencyCorridor(Base):
    __tablename__ = "emergency_corridors"
    id = Column(Integer, primary_key=True, index=True)
    ambulance_id = Column(String, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    route_junctions = Column(JSON, nullable=False)  # Stores path junctions/actions
    status = Column(SQLEnum(CorridorStatus), nullable=False, default=CorridorStatus.active)
    activated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    eta_normal = Column(Integer, nullable=False)  # in seconds
    eta_optimized = Column(Integer, nullable=False)  # in seconds
