from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.core.config import settings
from src.core.cors import setup_cors
from src.api import routes_base
from src.utils.logger import logger


# Define lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    await startup_event()
    yield
    # Shutdown event
    await shutdown_event()


# Startup event function
async def startup_event():
    logger.info("🚀 Starting up...")


# Shutdown event function
async def shutdown_event():
    logger.info("🛑 Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Setup CORS and middlewares
setup_cors(app)

# Include routes
app.include_router(routes_base.router)
