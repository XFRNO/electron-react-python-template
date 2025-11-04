from fastapi import APIRouter


# Base router
router = APIRouter()

# Include all routers
router.include_router(health.router)
