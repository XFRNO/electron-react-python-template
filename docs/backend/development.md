# Backend Development

This guide explains how to run the backend application in a development environment.

## Running the Development Server

To start the backend development server, you first need to create a virtual environment and install the dependencies.

```bash
# From the root of the monorepo
uv venv apps/backend/.venv
source apps/backend/.venv/bin/activate
uv pip install -e apps/backend
```

Then, you can start the development server:

```bash
cd apps/backend
uvicorn src.main:app --reload
```

This will start the FastAPI development server with hot reloading enabled.

Alternatively, you can run the entire application (Electron, React, and Python) in development mode from the root of the monorepo:

```bash
pnpm dev
```

## Running Tests

To run the backend tests, make sure you have the development dependencies installed, then run the following command from the `apps/backend` directory:

```bash
cd apps/backend
pytest
```

## Integration with Electron

The Electron app is configured to manage the Python backend process. In development, it will attempt to connect to the running FastAPI server. In production, it will spawn the backend executable.
