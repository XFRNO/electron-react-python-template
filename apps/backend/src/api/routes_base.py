from fastapi import APIRouter
from src.api.routes.health import router as health_router

# Base router
router = APIRouter()

# Include all routers

# Health check router
router.include_router(health_router)
