from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.db.session import get_db
from backend.app.db.models import AIRecommendation, RecommendationStatus, RecommendationPriority
from backend.app.schemas.schemas import RecommendationOut

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("", response_model=List[RecommendationOut])
async def list_recommendations(
    priority: Optional[str] = Query(default=None, description="Filter by priority (P0, P1, P2, P3, P4)"),
    status: Optional[str] = Query(default=None, description="Filter by status (pending, deployed, dismissed)"),
    db: Session = Depends(get_db)
):
    """
    Get lists of AI recommendations for the dashboard, with filters for priority and deployment status.
    """
    query = db.query(AIRecommendation)
    
    if priority:
        try:
            rec_priority = RecommendationPriority(priority.upper())
            query = query.filter(AIRecommendation.priority == rec_priority)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid priority: {priority}")
            
    if status:
        try:
            rec_status = RecommendationStatus(status.lower())
            query = query.filter(AIRecommendation.status == rec_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
            
    recs = query.order_by(AIRecommendation.created_at.desc()).all()
    return recs

@router.post("/{id}/deploy", response_model=RecommendationOut)
async def deploy_recommendation(id: int, db: Session = Depends(get_db)):
    """
    Deploy an AI recommendation, setting its status to 'deployed' and applying optimization triggers.
    """
    rec = db.query(AIRecommendation).filter(AIRecommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Recommendation with ID {id} not found.")
        
    rec.status = RecommendationStatus.deployed
    db.commit()
    db.refresh(rec)
    return rec

@router.post("/{id}/dismiss", response_model=RecommendationOut)
async def dismiss_recommendation(id: int, db: Session = Depends(get_db)):
    """
    Dismiss/ignore an AI recommendation, setting its status to 'dismissed'.
    """
    rec = db.query(AIRecommendation).filter(AIRecommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Recommendation with ID {id} not found.")
        
    rec.status = RecommendationStatus.dismissed
    db.commit()
    db.refresh(rec)
    return rec
