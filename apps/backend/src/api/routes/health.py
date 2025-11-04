from fastapi import APIRouter

# Health check router
router = APIRouter(prefix="/health", tags=["health"])


# Health check endpoint
@router.get("/")
def health_check():
    return {"status": "ok"}
