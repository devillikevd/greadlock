import logging
import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import EmergencyCorridor, SignalTiming, SignalMode, Junction, CorridorStatus

logger = logging.getLogger(__name__)

# Adjacency list representing real-world connectivity and travel time weights (seconds)
BENGALURU_TRAFFIC_GRAPH = {
    "silk-board": {"electronic-city": 600, "marathahalli": 500, "bannerghatta": 360},
    "kr-puram": {"tin-factory": 120, "hebbal": 480, "marathahalli": 400, "whitefield": 450},
    "tin-factory": {"kr-puram": 120, "hebbal": 420, "marathahalli": 360, "nagawara": 300},
    "marathahalli": {"silk-board": 500, "kr-puram": 400, "tin-factory": 360, "whitefield": 300},
    "whitefield": {"marathahalli": 300, "kr-puram": 450},
    "electronic-city": {"silk-board": 600, "bannerghatta": 540},
    "bannerghatta": {"silk-board": 360, "electronic-city": 540},
    "hebbal": {"mekhri-circle": 240, "kr-puram": 480, "tin-factory": 420, "nagawara": 300},
    "mekhri-circle": {"hebbal": 240, "nagawara": 360},
    "nagawara": {"hebbal": 300, "mekhri-circle": 360, "tin-factory": 300}
}

def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculates distance in meters between two lat/lng coordinates."""
    R = 6371000  # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    
    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def dijkstra(graph: Dict[str, Dict[str, int]], start: str, end: str) -> Optional[List[str]]:
    """Calculates shortest path between two nodes using Dijkstra's algorithm."""
    if start not in graph or end not in graph:
        return None
        
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    previous = {node: None for node in graph}
    unvisited = list(graph.keys())
    
    while unvisited:
        # Find node with minimum distance
        current = min(unvisited, key=lambda node: distances[node])
        
        if distances[current] == float('inf') or current == end:
            break
            
        unvisited.remove(current)
        
        for neighbor, weight in graph[current].items():
            alt = distances[current] + weight
            if alt < distances[neighbor]:
                distances[neighbor] = alt
                previous[neighbor] = current
                
    path = []
    current = end
    while current is not None:
        path.insert(0, current)
        current = previous[current]
        
    return path if path[0] == start else None

class EmergencyCorridorService:
    def find_nearest_junction(self, db_session: Session, lat: float, lng: float) -> Junction:
        """Finds the closest junction to the given GPS coordinates."""
        junctions = db_session.query(Junction).all()
        if not junctions:
            raise ValueError("No junctions seeded in database.")
            
        nearest = junctions[0]
        min_dist = float('inf')
        
        for j in junctions:
            dist = haversine_distance(lat, lng, j.lat, j.lng)
            if dist < min_dist:
                min_dist = dist
                nearest = j
                
        return nearest

    def activate_corridor(self, db_session: Session, ambulance_id: str, origin_id: str, dest_id: str) -> Dict[str, Any]:
        """
        Solves shortest path and activates a green corridor.
        Sets signal timings on path to GREEN EXTENDED.
        """
        # Find shortest path
        path = dijkstra(BENGALURU_TRAFFIC_GRAPH, origin_id, dest_id)
        if not path:
            return {"error": "No route found between junctions"}
            
        # Get junctions info
        junctions_map = {j.id: j for j in db_session.query(Junction).filter(Junction.id.in_(path)).all()}
        
        # Calculate ETA
        total_eta_normal = 0
        total_eta_optimized = 0
        route_steps = []
        
        # Override signal timings on the route
        for i, j_id in enumerate(path):
            j = junctions_map.get(j_id)
            j_name = j.name if j else j_id
            
            # Estimate travel time to this node
            step_normal_time = 0
            if i > 0:
                prev_id = path[i-1]
                step_normal_time = BENGALURU_TRAFFIC_GRAPH[prev_id].get(j_id, 300)
                
            # Clear corridor cuts travel time by 60% (optimized is 40% of normal)
            step_optimized_time = int(step_normal_time * 0.40)
            
            total_eta_normal += step_normal_time
            total_eta_optimized += step_optimized_time
            
            # Determine direction of travel (for Green Light Wave activation)
            # For simplicity: set all approach lanes to GREEN EXTENDED
            signal_action = "GREEN_EXTENDED_ACTIVE"
            
            # Apply override in DB
            sig = db_session.query(SignalTiming).filter(SignalTiming.junction_id == j_id).first()
            if sig:
                sig.mode = SignalMode.ai_adaptive
                # Extend N/S or E/W depending on current step
                sig.north_green = 80
                sig.south_green = 80
                sig.east_green = 80
                sig.west_green = 80
                sig.updated_at = datetime.utcnow()
                
            route_steps.append({
                "junction_id": j_id,
                "junction_name": j_name,
                "signal_action": signal_action,
                "eta_seconds": total_eta_optimized
            })
            
        db_session.commit()
        
        # Create Corridor record
        corridor = EmergencyCorridor(
            ambulance_id=ambulance_id,
            origin=junctions_map.get(origin_id).name if junctions_map.get(origin_id) else origin_id,
            destination=junctions_map.get(dest_id).name if junctions_map.get(dest_id) else dest_id,
            route_junctions=route_steps,
            status=CorridorStatus.active,
            activated_at=datetime.utcnow(),
            eta_normal=total_eta_normal,
            eta_optimized=total_eta_optimized
        )
        
        db_session.add(corridor)
        db_session.commit()
        db_session.refresh(corridor)
        
        return {
            "corridor_id": corridor.id,
            "route": route_steps,
            "total_eta_normal": total_eta_normal,
            "total_eta_optimized": total_eta_optimized,
            "status": corridor.status.value
        }

    def deactivate_corridor(self, db_session: Session, corridor_id: int) -> bool:
        """Deactivates emergency corridor and restores signal mode to fixed."""
        corridor = db_session.query(EmergencyCorridor).filter(EmergencyCorridor.id == corridor_id).first()
        if not corridor:
            return False
            
        corridor.status = CorridorStatus.completed
        
        # Restore signal timings on route
        for step in corridor.route_junctions:
            j_id = step["junction_id"]
            sig = db_session.query(SignalTiming).filter(SignalTiming.junction_id == j_id).first()
            if sig:
                sig.mode = SignalMode.fixed
                sig.north_green = 45
                sig.south_green = 45
                sig.east_green = 45
                sig.west_green = 45
                sig.updated_at = datetime.utcnow()
                
        db_session.commit()
        return True

    def check_expirations(self, db_session: Session):
        """Auto-expires corridors active for >30 minutes."""
        cutoff = datetime.utcnow() - timedelta(minutes=30)
        expired_corridors = db_session.query(EmergencyCorridor).filter(
            EmergencyCorridor.status == CorridorStatus.active,
            EmergencyCorridor.activated_at <= cutoff
        ).all()
        
        for c in expired_corridors:
            self.deactivate_corridor(db_session, c.id)
            logger.info(f"Auto-expired emergency corridor {c.id} after 30 minutes.")

emergency_service = EmergencyCorridorService()
