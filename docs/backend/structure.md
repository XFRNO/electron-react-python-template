# Backend Documentation

This document provides an overview of the backend application's structure and conventions.

## 🧩 Folder Structure Overview

`src/`
`├─ api/ — API routes and endpoints`
`│  ├─ __init__.py`
`│  └─ routes_base.py`
`├─ core/ — Core application settings and configurations`
`│  ├─ __init__.py`
`│  ├─ config.py`
`│  └─ cors.py`
`├─ db/ — Database related files (sessions, models, etc.)`
`│  ├─ __init__.py`
`│  └─ session.py`
`├─ main.py — Main application entry point`
`├─ schemas/ — Pydantic models for request and response validation`
`│  ├─ __init__.py`
`│  └─ example_schema.py`
`├─ services/ — Business logic and service layer`
`│  ├─ __init__.py`
`│  └─ example_service.py`
`└─ utils/ — Utility functions and helpers`
`   ├─ __init__.py`
`   └─ logger.py`

## 📘 Example: Adding a New API Endpoint

To create a new API endpoint for `users`:

1.  Create a new file: `src/api/routes_users.py`
2.  Define your API routes in `routes_users.py`.
3.  Include the new router in `src/main.py`.

**Example:**

```python
# src/api/routes_users.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/users/")
async def read_users():
    return [{"username": "foo"}, {"username": "bar"}]
```

```python
# src/main.py (excerpt)
# ...
from src.api import routes_base, routes_users

app.include_router(routes_base.router)
app.include_router(routes_users.router)
# ...
```