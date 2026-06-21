from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.db.session import get_db
from backend.app.db.models import SignalTiming, TrafficReading, Junction, SignalMode
from backend.app.schemas.schemas import SignalTimingOut, SignalOptimizeResult, SignalSimulateResult
from backend.app.services.signal_optimizer import optimize_signal_timing

router = APIRouter(prefix="/signals", tags=["Signals"])

def format_time_duration(seconds: int) -> str:
    m = seconds // 60
    s = seconds % 60
    if m > 0:
        return f"{m} min {s} sec"
    return f"{s} sec"

@router.get("/{junction_id}", response_model=SignalTimingOut)
async def get_signal_timings(junction_id: str, db: Session = Depends(get_db)):
    """
    Get current signal timings and mode (fixed/ai_adaptive) for a specific junction.
    """
    sig = db.query(SignalTiming).filter(SignalTiming.junction_id == junction_id).first()
    if not sig:
        # Create default timings if none exists
        sig = SignalTiming(
            junction_id=junction_id,
            north_green=45,
            south_green=45,
            east_green=45,
            west_green=45,
            mode=SignalMode.fixed
        )
        db.add(sig)
        db.commit()
        db.refresh(sig)
    return sig

@router.post("/{junction_id}/optimize", response_model=SignalOptimizeResult)
async def optimize_junction_signals(junction_id: str, db: Session = Depends(get_db)):
    """
    Calculate and return optimized green times for all directions at the junction based on live counts.
    Does not apply them to the DB.
    """
    latest = db.query(TrafficReading).filter(
        TrafficReading.junction_id == junction_id
    ).order_by(TrafficReading.time.desc()).first()
    
    if not latest:
        # Fallback default counts
        latest = TrafficReading(vehicle_count=1000)
        
    total = latest.vehicle_count
    n = int(total * 0.32)
    s = int(total * 0.28)
    e = int(total * 0.22)
    w = total - (n + s + e)
    
    result = optimize_signal_timing(n, s, e, w)
    return result

@router.post("/{junction_id}/apply", response_model=SignalTimingOut)
async def apply_signal_timings(
    junction_id: str, 
    timings: dict = Body(..., example={"north_green": 52, "south_green": 52, "east_green": 38, "west_green": 38}),
    db: Session = Depends(get_db)
):
    """
    Apply AI-optimized timings directly to a junction's physical signal configuration.
    Sets the operation mode to 'ai_adaptive'.
    """
    sig = db.query(SignalTiming).filter(SignalTiming.junction_id == junction_id).first()
    if not sig:
        sig = SignalTiming(junction_id=junction_id)
        db.add(sig)
        
    sig.north_green = timings.get("north_green", sig.north_green)
    sig.south_green = timings.get("south_green", sig.south_green)
    sig.east_green = timings.get("east_green", sig.east_green)
    sig.west_green = timings.get("west_green", sig.west_green)
    sig.mode = SignalMode.ai_adaptive
    sig.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(sig)
    return sig

@router.post("/simulate", response_model=SignalSimulateResult)
async def simulate_signals_comparison(
    junction_id: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Simulate a comparison between fixed timings and AI adaptive timings for the frontend comparison UI.
    """
    latest = db.query(TrafficReading).filter(
        TrafficReading.junction_id == junction_id
    ).order_by(TrafficReading.time.desc()).first()
    
    if not latest:
        latest = TrafficReading(vehicle_count=1200)
        
    total = latest.vehicle_count
    n = int(total * 0.33)
    s = int(total * 0.27)
    e = int(total * 0.22)
    w = total - (n + s + e)
    
    opt = optimize_signal_timing(n, s, e, w)
    
    # Calculate delays
    fixed_wait_sec = 260  # Default baseline: 4 min 20 sec
    wait_reduction_pct = opt["estimated_wait_reduction_pct"]
    ai_wait_sec = int(fixed_wait_sec * (1.0 - wait_reduction_pct / 100.0))
    
    fixed_throughput = 580  # vehicles/hr baseline
    throughput_increase_pct = opt["estimated_throughput_gain_pct"]
    ai_throughput = int(fixed_throughput * (1.0 + throughput_increase_pct / 100.0))
    
    fixed_co2 = 98  # kg/hr baseline
    co2_reduction_pct = opt["estimated_co2_reduction_pct"]
    ai_co2 = int(fixed_co2 * (1.0 - co2_reduction_pct / 100.0))
    
    return {
        "fixed": {
            "wait": format_time_duration(fixed_wait_sec),
            "throughput": fixed_throughput,
            "co2": fixed_co2,
            "north_green": 60,
            "south_green": 60,
            "east_green": 60,
            "west_green": 60
        },
        "ai": {
            "wait": format_time_duration(ai_wait_sec),
            "throughput": ai_throughput,
            "co2": ai_co2,
            "north_green": opt["north_green"],
            "south_green": opt["south_green"],
            "east_green": opt["east_green"],
            "west_green": opt["west_green"]
        },
        "wait_reduction_pct": wait_reduction_pct,
        "throughput_increase_pct": throughput_increase_pct,
        "co2_reduction_pct": co2_reduction_pct
    }
