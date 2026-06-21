from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.db.session import get_db
from app.db.models import Incident, Junction, IncidentStatus, IncidentType, Severity, Officer
from app.schemas.schemas import IncidentOut, IncidentCreate, IncidentUpdate

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentOut])
async def list_incidents(
    status: Optional[str] = Query(default=None, description="Filter by status (open, in_progress, resolved)"),
    zone: Optional[str] = Query(default=None, description="Filter by zone name (e.g. south)"),
    db: Session = Depends(get_db)
):
    """
    Get a list of logged traffic incidents, filtered optionally by status and geographical zone.
    """
    query = db.query(Incident)
    
    if status:
        try:
            inc_status = IncidentStatus(status.lower())
            query = query.filter(Incident.status == inc_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status value: {status}. Must be open, in_progress, or resolved.")
            
    if zone:
        query = query.join(Junction).filter(Junction.zone.ilike(f"%{zone}%"))
        
    incidents = query.order_by(Incident.detected_at.desc()).all()
    return incidents

@router.post("", response_model=IncidentOut)
async def create_incident(req: IncidentCreate, db: Session = Depends(get_db)):
    """
    Create a new incident log (triggered by CCTV automatic analysis or manual officer reports).
    """
    # Verify junction exists
    j = db.query(Junction).filter(Junction.id == req.junction_id).first()
    if not j:
        raise HTTPException(status_code=404, detail=f"Junction '{req.junction_id}' not found.")
        
    incident = Incident(
        junction_id=req.junction_id,
        type=req.type,
        severity=req.severity,
        status=IncidentStatus.open,
        detected_at=datetime.utcnow(),
        description=req.description
    )
    
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

@router.patch("/{id}", response_model=IncidentOut)
async def update_incident(id: int, req: IncidentUpdate, db: Session = Depends(get_db)):
    """
    Update status of an incident or assign an officer for dispatch.
    """
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident with ID {id} not found.")
        
    if req.status is not None:
        inc.status = req.status
        if req.status == IncidentStatus.resolved:
            inc.resolved_at = datetime.utcnow()
            
    if req.assigned_officer_id is not None:
        # Verify officer exists
        officer = db.query(Officer).filter(Officer.id == req.assigned_officer_id).first()
        if not officer:
            raise HTTPException(status_code=404, detail=f"Officer with ID {req.assigned_officer_id} not found.")
        inc.assigned_officer_id = req.assigned_officer_id
        
    db.commit()
    db.refresh(inc)
    return inc
