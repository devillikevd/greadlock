from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.db.session import get_db
from app.db.models import Junction, TrafficReading, Incident, IncidentStatus
from app.schemas.schemas import JunctionOut, JunctionDetailOut, ReadingOut, PredictionsOut, LaneInfo
from app.services.prediction import prediction_service

router = APIRouter(prefix="/junctions", tags=["Junctions"])

# Static mapping for high-fidelity realistic lane names
JUNCTION_LANES = {
    "silk-board": ["Hosur Road (N)", "Hosur Road (S)", "ORR East", "ORR West"],
    "kr-puram": ["Old Madras Road (W)", "Old Madras Road (E)", "KR Puram Bridge", "Whitefield Road"],
    "hebbal": ["NH44 North", "NH44 South", "Bellary Road", "Hebbal Lake Road"],
    "marathahalli": ["Outer Ring Road (N)", "Outer Ring Road (S)", "Marathahalli Bridge", "ITPL Main Road"],
    "electronic-city": ["Hosur Road Phase 1", "Hosur Road Phase 2", "EC Access Road", "NICE Road Entry"],
    "whitefield": ["ITPL Main Road", "Channasandra Road", "Hope Farm Junction", "ECC Road"],
    "bannerghatta": ["BG Road (N)", "BG Road (S)", "Jaya Nagar Road", "BTM Ring Road"],
    "mekhri-circle": ["CV Raman Road", "Jayachamarajendra Road", "Bellary Road (N)", "Bellary Road (S)"],
    "tin-factory": ["ORR North", "ORR South", "Old Madras Road", "Kasturi Nagar Road"],
    "nagawara": ["Manyata Tech Park Gate", "Outer Ring Road (W)", "Outer Ring Road (E)", "Thanisandra Main Road"]
}

def get_trend_str(current: float, prev: float) -> str:
    diff = current - prev
    if diff > 1.0:
        return "up"
    elif diff < -1.0:
        return "down"
    return "stable"

def get_level_str(density: float) -> str:
    if density >= 85.0:
        return "CRITICAL"
    elif density >= 70.0:
        return "HIGH"
    elif density >= 45.0:
        return "MEDIUM"
    return "LOW"

def format_last_updated(dt: datetime) -> str:
    # Ensure naive datetime comparison to avoid timezone mismatch errors
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    diff = datetime.utcnow() - dt
    mins = int(diff.total_seconds() / 60)
    if mins < 1:
        return "Just now"
    if mins < 60:
        return f"{mins} min ago"
    hours = mins // 60
    if hours < 24:
        return f"{hours} hours ago"
    return dt.strftime("%I:%M %p")

@router.get("", response_model=List[JunctionOut])
async def list_junctions(db: Session = Depends(get_db)):
    """
    List all 10 Bengaluru junctions with a snapshot of their current traffic density, speed, and status.
    """
    junctions = db.query(Junction).all()
    out = []
    
    for j in junctions:
        # Get latest traffic reading
        latest = db.query(TrafficReading).filter(
            TrafficReading.junction_id == j.id
        ).order_by(TrafficReading.time.desc()).first()
        
        # Get the second latest reading to calculate trend
        second_latest = db.query(TrafficReading).filter(
            TrafficReading.junction_id == j.id
        ).order_by(TrafficReading.time.desc()).offset(1).first()
        
        density = latest.density_pct if latest else 45.0
        vehicle_count = latest.vehicle_count if latest else 1000
        avg_speed = latest.avg_speed if latest else 22.0
        last_updated_dt = latest.time if latest else datetime.utcnow()
        
        prev_density = second_latest.density_pct if second_latest else density
        trend = get_trend_str(density, prev_density)
        level = get_level_str(density)
        
        out.append({
            "id": j.id,
            "name": j.name,
            "zone": j.zone,
            "density": density,
            "vehicleCount": vehicle_count,
            "level": level,
            "avgSpeed": avg_speed,
            "trend": trend,
            "lastUpdated": format_last_updated(last_updated_dt),
            "lat": j.lat,
            "lng": j.lng
        })
        
    return out

@router.get("/{id}", response_model=JunctionDetailOut)
async def get_junction_detail(id: str, db: Session = Depends(get_db)):
    """
    Get detailed metrics for a single junction, including lane distribution, active incidents, and last 3 hours of readings.
    """
    j = db.query(Junction).filter(Junction.id == id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Junction not found")
        
    # Get latest reading
    latest = db.query(TrafficReading).filter(
        TrafficReading.junction_id == j.id
    ).order_by(TrafficReading.time.desc()).first()
    
    # Get the second latest reading to calculate trend
    second_latest = db.query(TrafficReading).filter(
        TrafficReading.junction_id == j.id
    ).order_by(TrafficReading.time.desc()).offset(1).first()
    
    density = latest.density_pct if latest else 45.0
    vehicle_count = latest.vehicle_count if latest else 1000
    avg_speed = latest.avg_speed if latest else 22.0
    last_updated_dt = latest.time if latest else datetime.utcnow()
    
    prev_density = second_latest.density_pct if second_latest else density
    trend = get_trend_str(density, prev_density)
    level = get_level_str(density)
    
    # Generate lane distribution matching vehicle categories
    lane_names = JUNCTION_LANES.get(j.id, ["Lane A", "Lane B", "Lane C", "Lane D"])
    lanes = []
    
    if latest:
        # Distribute vehicle_count proportionally across lanes
        total = latest.vehicle_count
        l_cnts = [int(total * 0.35), int(total * 0.25), int(total * 0.22), 0]
        l_cnts[3] = total - sum(l_cnts[:3])
        for name, count in zip(lane_names, l_cnts):
            lanes.append(LaneInfo(name=name, count=max(0, count)))
    else:
        for name in lane_names:
            lanes.append(LaneInfo(name=name, count=250))
            
    # Fetch active incidents
    incidents = db.query(Incident).filter(
        Incident.junction_id == j.id,
        Incident.status != IncidentStatus.resolved
    ).order_by(Incident.detected_at.desc()).all()
    
    # Fetch last 3 hours of readings (15-min intervals = 12 readings)
    last_3_hours = db.query(TrafficReading).filter(
        TrafficReading.junction_id == j.id
    ).order_by(TrafficReading.time.desc()).limit(12).all()
    
    # Reverse so it reads chronological in frontend charts
    last_3_hours.reverse()
    
    return {
        "id": j.id,
        "name": j.name,
        "zone": j.zone,
        "density": density,
        "vehicleCount": vehicle_count,
        "level": level,
        "avgSpeed": avg_speed,
        "trend": trend,
        "lastUpdated": format_last_updated(last_updated_dt),
        "lat": j.lat,
        "lng": j.lng,
        "lanes": lanes,
        "incidents": incidents,
        "last_3_hours_readings": last_3_hours
    }

@router.get("/{id}/readings", response_model=List[ReadingOut])
async def get_junction_readings(
    id: str, 
    interval: str = "15m", 
    hours: int = Query(default=3, ge=1, le=48), 
    db: Session = Depends(get_db)
):
    """
    Get time-series historical traffic readings for charts. Supported intervals: 15m.
    """
    j = db.query(Junction).filter(Junction.id == id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Junction not found")
        
    # Determine limit based on hours and interval
    # Default is 15-min intervals: 4 readings per hour
    readings_limit = hours * 4
    
    readings = db.query(TrafficReading).filter(
        TrafficReading.junction_id == id
    ).order_by(TrafficReading.time.desc()).limit(readings_limit).all()
    
    readings.reverse()
    return readings

@router.get("/{id}/predictions", response_model=PredictionsOut)
async def get_junction_predictions(id: str, db: Session = Depends(get_db)):
    """
    Fetch machine learning traffic density predictions for 15min, 30min, 60min, and 3hr horizons.
    """
    j = db.query(Junction).filter(Junction.id == id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Junction not found")
        
    latest = db.query(TrafficReading).filter(
        TrafficReading.junction_id == id
    ).order_by(TrafficReading.time.desc()).first()
    
    current_density = latest.density_pct if latest else 50.0
    
    preds = prediction_service.predict(db, id, current_density)
    
    return {"predictions": preds}
