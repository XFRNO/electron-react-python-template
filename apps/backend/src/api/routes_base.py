from fastapi import APIRouter
from src.api.routes.health import router as health_router

# Base router
router = APIRouter()

# Include all routers
router.include_router(health_router)
