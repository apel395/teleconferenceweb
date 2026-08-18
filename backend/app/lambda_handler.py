from mangum import Mangum
from .main import app

# API Gateway HTTP API / Lambda adapter for FastAPI.
# Lifespan remains enabled so the existing startup initialization runs once
# per warm Lambda execution environment, not once per request.
handler = Mangum(app, lifespan="auto")
