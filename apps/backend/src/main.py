from fastapi import FastAPI
from src.core.config import settings
from src.api import routes_base
from src.utils.logger import logger

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down...")

app.include_router(routes_base.router)
