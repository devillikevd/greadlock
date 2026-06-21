from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.db.models import EmergencyCorridor, CorridorStatus
from app.schemas.schemas import EmergencyCorridorCreate, EmergencyCorridorOut
from app.services.emergency_corridor import emergency_service

router = APIRouter(prefix="/emergency", tags=["Emergency"])

@router.post("/corridor", response_model=EmergencyCorridorOut)
async def activate_emergency_corridor(
    req: EmergencyCorridorCreate,
    db: Session = Depends(get_db)
):
    """
    Activate a green wave corridor. Resolves the nearest junction to coordinates,
    computes Dijkstra shortest path, and overrides junction signals to GREEN wave.
    """
    # 1. Resolve starting junction from coordinates
    try:
        start_j = emergency_service.find_nearest_junction(db, req.current_lat, req.current_lng)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # 2. Activate corridor path
    result = emergency_service.activate_corridor(
        db_session=db,
        ambulance_id=req.ambulance_id,
        origin_id=start_j.id,
        dest_id=req.destination_junction_id
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.get("/corridor/{id}", response_model=EmergencyCorridorOut)
async def get_corridor_status(id: int, db: Session = Depends(get_db)):
    """
    Get live status and signal-by-signal routing details of an active green corridor.
    """
    c = db.query(EmergencyCorridor).filter(EmergencyCorridor.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Emergency corridor with ID {id} not found.")
        
    return {
        "corridor_id": c.id,
        "route": c.route_junctions,
        "total_eta_normal": c.eta_normal,
        "total_eta_optimized": c.eta_optimized,
        "status": c.status.value
    }

@router.delete("/corridor/{id}")
async def deactivate_corridor(id: int, db: Session = Depends(get_db)):
    """
    Deactivate the emergency corridor and restore overridden signal timings to standard fixed operation.
    """
    success = emergency_service.deactivate_corridor(db, id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Emergency corridor with ID {id} not found.")
        
    return {"message": f"Emergency corridor {id} successfully deactivated. Signal operations restored."}
