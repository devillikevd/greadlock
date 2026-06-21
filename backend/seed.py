import os
import sys
import random
from datetime import datetime, timedelta
import math
from sqlalchemy import text
import bcrypt

# Add the backend directory to path so app.* imports resolve correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import sync_engine, SyncSessionLocal, Base
from app.db.models import (
    User, UserRole, Officer, Junction, TrafficReading, 
    Incident, IncidentType, Severity, IncidentStatus,
    AIRecommendation, RecommendationPriority, RecommendationStatus,
    SignalTiming, SignalMode
)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

# 10 Bengaluru Junctions details
JUNCTIONS_DATA = [
    {"id": "silk-board", "name": "Silk Board Junction", "zone": "South Bengaluru", "lat": 12.9175, "lng": 77.6229, "road_capacity": 3000},
    {"id": "kr-puram", "name": "KR Puram Junction", "zone": "East Bengaluru", "lat": 13.0052, "lng": 77.6961, "road_capacity": 2500},
    {"id": "hebbal", "name": "Hebbal Flyover Junction", "zone": "North Bengaluru", "lat": 13.0358, "lng": 77.5970, "road_capacity": 2200},
    {"id": "marathahalli", "name": "Marathahalli Bridge", "zone": "East Bengaluru", "lat": 12.9592, "lng": 77.6974, "road_capacity": 2600},
    {"id": "electronic-city", "name": "Electronic City Junction", "zone": "South Bengaluru", "lat": 12.8456, "lng": 77.6603, "road_capacity": 2400},
    {"id": "whitefield", "name": "Whitefield Junction", "zone": "East Bengaluru", "lat": 12.9698, "lng": 77.7500, "road_capacity": 2200},
    {"id": "bannerghatta", "name": "Bannerghatta Road Junction", "zone": "South Bengaluru", "lat": 12.8950, "lng": 77.5980, "road_capacity": 2000},
    {"id": "mekhri-circle", "name": "Mekhri Circle", "zone": "North Bengaluru", "lat": 13.0145, "lng": 77.5830, "road_capacity": 2000},
    {"id": "tin-factory", "name": "Tin Factory Junction", "zone": "East Bengaluru", "lat": 13.0040, "lng": 77.6765, "road_capacity": 2800},
    {"id": "nagawara", "name": "Nagawara Junction", "zone": "North Bengaluru", "lat": 13.0440, "lng": 77.6240, "road_capacity": 1800}
]

OFFICERS_DATA = [
    {"name": "Ravi Kumar", "rank": "Head Constable", "zone": "South Bengaluru", "badge_number": "HC-1092", "mobile": "9876543210"},
    {"name": "Suresh Kumar", "rank": "Inspector", "zone": "South Bengaluru", "badge_number": "IN-5501", "mobile": "9876543211"},
    {"name": "Venkatesh", "rank": "Sub-Inspector", "zone": "East Bengaluru", "badge_number": "SI-3392", "mobile": "9876543212"},
    {"name": "Meera Sharma", "rank": "ACP", "zone": "South Bengaluru", "badge_number": "ACP-0045", "mobile": "9876543213"},
    {"name": "Rajiv Nair", "rank": "Commissioner", "zone": "Bengaluru Central", "badge_number": "COM-0001", "mobile": "9876543214"},
    {"name": "Manjunath", "rank": "Head Constable", "zone": "East Bengaluru", "badge_number": "HC-8812", "mobile": "9876543215"},
    {"name": "Pradeep", "rank": "Sub-Inspector", "zone": "North Bengaluru", "badge_number": "SI-2201", "mobile": "9876543216"}
]

USERS_DATA = [
    {"email": "constable@btp.gov.in", "role": UserRole.constable, "password": "password123"},
    {"email": "inspector@btp.gov.in", "role": UserRole.inspector, "password": "password123"},
    {"email": "acp@btp.gov.in", "role": UserRole.acp, "password": "password123"},
    {"email": "commissioner@btp.gov.in", "role": UserRole.commissioner, "password": "password123"},
    {"email": "public@btp.gov.in", "role": UserRole.public, "password": "password123"},
]

def is_indian_holiday(dt: datetime) -> bool:
    # Basic Indian Holidays List (simplified for simulation)
    # Republic Day (Jan 26), Independence Day (Aug 15), Gandhi Jayanti (Oct 2), Kannada Rajyotsava (Nov 1)
    if dt.month == 1 and dt.day == 26:
        return True
    if dt.month == 8 and dt.day == 15:
        return True
    if dt.month == 10 and dt.day == 2:
        return True
    if dt.month == 11 and dt.day == 1:
        return True
    return False

def generate_reading(dt: datetime, j_id: str, capacity: int) -> dict:
    hour = dt.hour
    minute = dt.minute
    day_of_week = dt.weekday()
    is_weekend = day_of_week >= 5
    
    # Base density for junction characteristics
    base_density = {
        "silk-board": 62.0,
        "kr-puram": 52.0,
        "hebbal": 42.0,
        "marathahalli": 58.0,
        "electronic-city": 45.0,
        "whitefield": 50.0,
        "bannerghatta": 46.0,
        "mekhri-circle": 42.0,
        "tin-factory": 56.0,
        "nagawara": 40.0
    }.get(j_id, 45.0)

    # Calculate rush hour factor using time of day
    time_val = hour + minute / 60.0
    
    # Morning rush peak at 9:00 AM, Evening rush peak at 6:30 PM
    if not is_weekend:
        # Dual peak bell curves
        m_peak = math.exp(-((time_val - 9.0) ** 2) / 2.2)  # 8am - 10am peak
        e_peak = math.exp(-((time_val - 18.5) ** 2) / 3.0)  # 5pm - 8pm peak
        rush_factor = 0.35 + 1.3 * m_peak + 1.5 * e_peak
    else:
        # Weekend has a flatter, afternoon-evening surge
        w_surge = math.exp(-((time_val - 16.0) ** 2) / 10.0)
        rush_factor = 0.4 + 0.8 * w_surge

    # Add holiday reductions
    if is_indian_holiday(dt):
        rush_factor *= 0.55

    # Random noise (-6% to +6%)
    noise = random.uniform(-6.0, 6.0)
    
    density = base_density * rush_factor + noise
    density = min(100.0, max(5.0, density))
    
    vehicle_count = int(capacity * (density / 100.0))
    
    # Average speed decreases as density increases (standard macro traffic flow)
    # Free flow speed is 50 km/h, drop down to 3 km/h in total congestion
    avg_speed = 50.0 * (1.0 - (density / 115.0)) ** 1.5
    avg_speed = min(50.0, max(3.0, avg_speed))
    
    # Vehicle classes counts summing to total count
    cars_pct = random.uniform(0.30, 0.38)
    bikes_pct = random.uniform(0.40, 0.46)
    buses_pct = random.uniform(0.03, 0.05)
    trucks_pct = random.uniform(0.01, 0.03)
    autos_pct = 1.0 - (cars_pct + bikes_pct + buses_pct + trucks_pct)
    
    cars = int(vehicle_count * cars_pct)
    bikes = int(vehicle_count * bikes_pct)
    buses = int(vehicle_count * buses_pct)
    trucks = int(vehicle_count * trucks_pct)
    autos = vehicle_count - (cars + bikes + buses + trucks)
    
    # Pedestrians are counted separately
    pedestrians = int(vehicle_count * random.uniform(0.05, 0.15))
    
    return {
        "time": dt,
        "junction_id": j_id,
        "vehicle_count": vehicle_count,
        "density_pct": round(density, 1),
        "avg_speed": round(avg_speed, 1),
        "cars": cars,
        "bikes": bikes,
        "buses": buses,
        "trucks": trucks,
        "autos": max(0, autos),
        "pedestrians": pedestrians
    }

def main():
    print("--- Starting AI Traffic Copilot DB Seeder ---")
    
    # 1. Create tables
    print("Creating tables...")
    Base.metadata.create_all(bind=sync_engine)
    
    session = SyncSessionLocal()
    
    # 2. TimescaleDB Setup (PostgreSQL only)
    if sync_engine.dialect.name == "postgresql":
        print("Checking TimescaleDB extension and hypertables...")
        try:
            session.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))
            session.commit()
            
            # Check if traffic_readings is already a hypertable
            res = session.execute(text(
                "SELECT * FROM timescaledb_information.hypertables WHERE hypertable_name = 'traffic_readings';"
            )).fetchone()
            if not res:
                print("Creating hypertable for traffic_readings...")
                session.execute(text(
                    "SELECT create_hypertable('traffic_readings', 'time', if_not_exists => TRUE);"
                ))
                session.commit()
            else:
                print("traffic_readings is already a TimescaleDB hypertable.")
        except Exception as e:
            session.rollback()
            print(f"TimescaleDB initialization warning (continuing without it): {e}")

    # 3. Seed Junctions
    print("Seeding Junctions...")
    existing_junctions = {j.id for j in session.query(Junction.id).all()}
    junctions_to_add = []
    for j in JUNCTIONS_DATA:
        if j["id"] not in existing_junctions:
            junctions_to_add.append(Junction(**j))
    if junctions_to_add:
        session.add_all(junctions_to_add)
        session.commit()
        print(f"Added {len(junctions_to_add)} junctions.")
    else:
        print("Junctions already seeded.")

    # 4. Seed Officers
    print("Seeding Officers...")
    existing_officers = {o.badge_number for o in session.query(Officer.badge_number).all()}
    officers_to_add = []
    for o in OFFICERS_DATA:
        if o["badge_number"] not in existing_officers:
            officers_to_add.append(Officer(**o))
    if officers_to_add:
        session.add_all(officers_to_add)
        session.commit()
        print(f"Added {len(officers_to_add)} officers.")
    else:
        print("Officers already seeded.")

    # Get officer IDs for incident assignments
    officer_ids = [o.id for o in session.query(Officer.id).all()]

    # 5. Seed Users
    print("Seeding Users...")
    existing_users = {u.email for u in session.query(User.email).all()}
    users_to_add = []
    for u in USERS_DATA:
        if u["email"] not in existing_users:
            users_to_add.append(User(
                email=u["email"],
                role=u["role"],
                password_hash=hash_password(u["password"])
            ))
    if users_to_add:
        session.add_all(users_to_add)
        session.commit()
        print(f"Added {len(users_to_add)} users.")
    else:
        print("Users already seeded.")

    # 6. Seed Signal Timings
    print("Seeding Signal Timings...")
    existing_signals = {s.junction_id for s in session.query(SignalTiming.junction_id).all()}
    signals_to_add = []
    for j in JUNCTIONS_DATA:
        if j["id"] not in existing_signals:
            # Seed default 45s greens
            signals_to_add.append(SignalTiming(
                junction_id=j["id"],
                north_green=45,
                south_green=45,
                east_green=45,
                west_green=45,
                mode="fixed"
            ))
    if signals_to_add:
        session.add_all(signals_to_add)
        session.commit()
        print(f"Added default signal timings for {len(signals_to_add)} junctions.")

    # 7. Seed Incidents
    print("Seeding Incidents...")
    if session.query(Incident).count() == 0:
        now = datetime.utcnow()
        incidents = [
            Incident(
                junction_id="silk-board",
                type=IncidentType.stopped_vehicle,
                severity=Severity.P0,
                status=IncidentStatus.open,
                detected_at=now - timedelta(minutes=45),
                assigned_officer_id=random.choice(officer_ids) if officer_ids else None,
                description="Vehicle breakdown blocking Hosur Road northbound. Extreme backup."
            ),
            Incident(
                junction_id="marathahalli",
                type=IncidentType.accident,
                severity=Severity.P1,
                status=IncidentStatus.in_progress,
                detected_at=now - timedelta(hours=1),
                assigned_officer_id=random.choice(officer_ids) if officer_ids else None,
                description="Minor collision between two cars on Outer Ring Road southbound. Police clearing lane."
            ),
            Incident(
                junction_id="electronic-city",
                type=IncidentType.roadblock,
                severity=Severity.P2,
                status=IncidentStatus.open,
                detected_at=now - timedelta(hours=2),
                assigned_officer_id=None,
                description="Pothole repair work causing temporary lane closure."
            ),
            Incident(
                junction_id="kr-puram",
                type=IncidentType.wrong_way,
                severity=Severity.P1,
                status=IncidentStatus.resolved,
                detected_at=now - timedelta(hours=3),
                resolved_at=now - timedelta(hours=2, minutes=30),
                assigned_officer_id=random.choice(officer_ids) if officer_ids else None,
                description="Two-wheeler intercepted driving wrong way on flyover ramp."
            )
        ]
        session.add_all(incidents)
        session.commit()
        print(f"Added {len(incidents)} sample incidents.")

    # 8. Seed AI Recommendations
    print("Seeding AI Recommendations...")
    if session.query(AIRecommendation).count() == 0:
        now = datetime.utcnow()
        recs = [
            AIRecommendation(
                junction_id="silk-board",
                priority=RecommendationPriority.P0,
                action_type="Signal Optimization",
                action_detail="Extend green phase duration for Hosur Road (N) by 45s. Coordinate BTM Layout signal to buffer trailing flow.",
                confidence_score=0.94,
                status=RecommendationStatus.pending,
                created_at=now - timedelta(minutes=15)
            ),
            AIRecommendation(
                junction_id="marathahalli",
                priority=RecommendationPriority.P1,
                action_type="Signal Optimization",
                action_detail="Extend Outer Ring Road (S) green phase by 30s to clear tailbacks from accident site.",
                confidence_score=0.89,
                status=RecommendationStatus.deployed,
                created_at=now - timedelta(minutes=30)
            ),
            AIRecommendation(
                junction_id="kr-puram",
                priority=RecommendationPriority.P2,
                action_type="Signal Optimization",
                action_detail="AI recommendation: Extend green phase on Whitefield Road by 45s to clear bridge load.",
                confidence_score=0.82,
                status=RecommendationStatus.pending,
                created_at=now - timedelta(minutes=45)
            )
        ]
        session.add_all(recs)
        session.commit()
        print(f"Added {len(recs)} sample recommendations.")

    # 9. Seed 2 Years of Traffic Readings (15-min intervals)
    # To prevent seeding taking too long, let's make it efficient
    # 2 years = 730 days. Let's do 15-minute readings.
    # Total readings = 730 * 24 * 4 = 70080 per junction.
    # Total for 10 junctions = ~700k records.
    print("Checking if historical traffic readings are already seeded...")
    existing_count = session.query(TrafficReading).count()
    if existing_count > 10000:
        print(f"Already {existing_count} readings in the DB. Skipping historical generation.")
        session.close()
        return

    print("Generating 2 years of historical traffic readings (this may take a few seconds)...")
    end_time = datetime.utcnow()
    # Align to nearest 15 minutes
    end_time = end_time.replace(minute=(end_time.minute // 15) * 15, second=0, microsecond=0)
    start_time = end_time - timedelta(days=730)
    
    # We will generate in chunks of 50k to control memory usage and insert efficiently
    chunk_size = 50000
    current_time = start_time
    delta = timedelta(minutes=15)
    
    records = []
    total_inserted = 0
    
    # Pre-cache junction list to avoid ORM queries
    junctions_list = session.query(Junction.id, Junction.road_capacity).all()
    
    # Calculate number of steps
    total_steps = int((end_time - start_time) / delta)
    print(f"Total time steps to generate: {total_steps} (for 10 junctions, that is {total_steps * 10} readings)")
    
    # Progress feedback
    milestone = total_steps // 10
    step = 0
    
    while current_time <= end_time:
        for j_id, road_capacity in junctions_list:
            records.append(generate_reading(current_time, j_id, road_capacity))
            
            if len(records) >= chunk_size:
                session.bulk_insert_mappings(TrafficReading, records)
                session.commit()
                total_inserted += len(records)
                records = []
                
        current_time += delta
        step += 1
        if milestone > 0 and step % milestone == 0:
            print(f"Generated {step}/{total_steps} steps... ({total_inserted} rows inserted)")

    # Insert remaining
    if records:
        session.bulk_insert_mappings(TrafficReading, records)
        session.commit()
        total_inserted += len(records)
        
    print(f"Successfully seeded {total_inserted} traffic reading records!")
    session.close()

if __name__ == "__main__":
    main()
