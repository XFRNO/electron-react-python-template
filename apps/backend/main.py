from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import sys
import logging
import socket

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Electron React Python Template API")

# Dynamically set CORS origins
frontend_port = os.environ.get("FRONTEND_PORT")

app.add_middleware(
    CORSMiddleware,
   #  allow_origins=[f"http://localhost:{frontend_port}", f"http://127.0.0.1:{frontend_port}"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    logger.info("Root endpoint accessed")
    return {"message": "Hello from Python FastAPI backend!"}

@app.get("/api/hello")
def read_hello():
    logger.info("Hello endpoint accessed")
    return {"message": "Hello from the Python backend! This is a test API endpoint."}

@app.get("/api/ping")
def read_ping():
    logger.info("Ping endpoint accessed")
    return {"message": "pong"}



@app.get("/api/status")
def read_status():
    logger.info("Status endpoint accessed")
    return {
        "status": "running",
        "service": "Electron React Python Template Backend",
        "version": "1.0.0"
    }

def find_free_port():
    """Find a free port to bind the server to"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

if __name__ == "__main__":
    # Get port from environment variable (Electron sets BACKEND_PORT)
    port_env = os.environ.get("BACKEND_PORT") or os.environ.get("PORT")
    if port_env:
        try:
            port = int(port_env)
            logger.info(f"Using port from env variable: {port}")
        except ValueError:
            logger.warning(f"Invalid port value: {port_env}, finding free port")
            port = find_free_port()
    else:
        logger.info("Finding free port")
        port = find_free_port()

    logger.info(f"Starting backend on port {port}")
    uvicorn.run(app, host="127.0.0.1", port=port, reload=False)
