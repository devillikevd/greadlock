import redis
import json
import logging
import random
from datetime import datetime, timedelta
from backend.app.tasks.celery_app import celery_app
from backend.app.db.session import SyncSessionLocal
from backend.app.db.models import (
    Junction, TrafficReading, Incident, IncidentType, Severity, IncidentStatus,
    AIRecommendation, RecommendationPriority, RecommendationStatus
)
from backend.app.config import settings

logger = logging.getLogger(__name__)

# Initialize Redis client safely
try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
except Exception as e:
    logger.warning(f"Failed to connect to Redis: {e}. Broadcasting will be mocked.")
    redis_client = None

def get_trend(current_density: float, prev_density: float) -> str:
    diff = current_density - prev_density
    if diff > 1.0:
        return "up"
    elif diff < -1.0:
        return "down"
    return "stable"

@celery_app.task
def run_traffic_simulation():
    """
    Background simulation running every 15 seconds.
    Generates traffic status, random incidents, publishes via Redis pub/sub, and saves to database.
    """
    db = SyncSessionLocal()
    try:
        from backend.seed import generate_reading
        
        junctions = db.query(Junction).all()
        now = datetime.utcnow()
        
        for j in junctions:
            # Generate simulated reading matching time patterns
            reading_dict = generate_reading(now, j.id, j.road_capacity)
            reading = TrafficReading(**reading_dict)
            db.add(reading)
            
            # Fetch previous reading to compute trend
            prev_reading = db.query(TrafficReading).filter(
                TrafficReading.junction_id == j.id,
                TrafficReading.time < now
            ).order_by(TrafficReading.time.desc()).first()
            
            prev_dens = prev_reading.density_pct if prev_reading else reading.density_pct
            trend = get_trend(reading.density_pct, prev_dens)
            
            status_level = "LOW"
            if reading.density_pct >= 85:
                status_level = "CRITICAL"
            elif reading.density_pct >= 70:
                status_level = "HIGH"
            elif reading.density_pct >= 45:
                status_level = "MEDIUM"
                
            # WebSocket Broadcast Payload
            payload = {
                "type": "traffic_update",
                "junction_id": j.id,
                "density_pct": reading.density_pct,
                "vehicle_count": reading.vehicle_count,
                "avg_speed": reading.avg_speed,
                "trend": trend,
                "status": status_level,
                "timestamp": now.isoformat()
            }
            
            # Broadcast to Redis Pub/Sub channels
            if redis_client:
                try:
                    redis_client.publish(f"traffic_channel:{j.id}", json.dumps(payload))
                    redis_client.publish("traffic_channel:global", json.dumps(payload))
                except Exception as e:
                    logger.error(f"Redis publish error for junction {j.id}: {e}")
            
            # 0.5% probability of generating a new random traffic incident
            if random.random() < 0.005:
                inc_type = random.choice(list(IncidentType))
                severity = random.choice([Severity.P0, Severity.P1, Severity.P2])
                
                # Check for active incident of same type to prevent noise
                existing = db.query(Incident).filter(
                    Incident.junction_id == j.id,
                    Incident.type == inc_type,
                    Incident.status != IncidentStatus.resolved
                ).first()
                
                if not existing:
                    desc_map = {
                        IncidentType.accident: "Minor accident between private cars blocking left lanes.",
                        IncidentType.fire: "Vehicle fire on flyover ramp. Fire tenders summoned.",
                        IncidentType.wrong_way: "Two-wheeler heading wrong way causing flow disruptions.",
                        IncidentType.stopped_vehicle: "KSRTC bus breakdown blocking middle carriage.",
                        IncidentType.roadblock: "Waterlogging due to heavy rain. Traffic diverted."
                    }
                    incident = Incident(
                        junction_id=j.id,
                        type=inc_type,
                        severity=severity,
                        status=IncidentStatus.open,
                        detected_at=now,
                        description=desc_map.get(inc_type, "Traffic disruption reported.")
                    )
                    db.add(incident)
                    db.commit()
                    db.refresh(incident)
                    
                    # Publish Incident Alert
                    alert_payload = {
                        "type": "incident_alert",
                        "priority": severity.value,
                        "junction_id": j.id,
                        "incident_type": inc_type.value,
                        "message": incident.description,
                        "timestamp": now.isoformat()
                    }
                    if redis_client:
                        try:
                            redis_client.publish("traffic_channel:incidents", json.dumps(alert_payload))
                            redis_client.publish(f"traffic_channel:{j.id}", json.dumps(alert_payload))
                        except Exception as e:
                            logger.error(f"Redis publish incident alert error: {e}")
                            
                    # Generate AI signal timing optimization recommendation for incident
                    if severity in [Severity.P0, Severity.P1]:
                        rec = AIRecommendation(
                            junction_id=j.id,
                            priority=RecommendationPriority.P0 if severity == Severity.P0 else RecommendationPriority.P1,
                            action_type="Signal Timing adjustment",
                            action_detail=f"Extend green phase by 45s on approach lanes to clear tailbacks from {inc_type.value}.",
                            confidence_score=0.91,
                            status=RecommendationStatus.pending,
                            created_at=now
                        )
                        db.add(rec)
                        db.commit()
                        db.refresh(rec)
                        
                        rec_payload = {
                            "type": "new_recommendation",
                            "priority": rec.priority.value,
                            "junction_id": j.id,
                            "action": rec.action_detail,
                            "confidence": rec.confidence_score,
                            "timestamp": now.isoformat()
                        }
                        if redis_client:
                            try:
                                redis_client.publish("traffic_channel:recommendations", json.dumps(rec_payload))
                                redis_client.publish(f"traffic_channel:{j.id}", json.dumps(rec_payload))
                            except Exception as e:
                                logger.error(f"Redis publish recommendation error: {e}")
                                
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error executing Celery traffic simulation: {e}")
    finally:
        db.close()
