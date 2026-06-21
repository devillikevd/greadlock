from celery import Celery
from app.config import settings

celery_app = Celery(
    "traffic_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Configure Celery Beat schedule to run simulation task every 15 seconds
celery_app.conf.beat_schedule = {
    "simulate-traffic-every-15s": {
        "task": "backend.app.tasks.traffic_simulation.run_traffic_simulation",
        "schedule": 15.0
    }
}
celery_app.conf.timezone = "Asia/Kolkata"
celery_app.autodiscover_tasks(["backend.app.tasks"])
