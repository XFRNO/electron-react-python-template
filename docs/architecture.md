# Project Architecture

This document provides a detailed overview of the monorepo structure, explaining the purpose of each folder and how the frontend and backend applications communicate.

## 🧩 Frontend Structure (`apps/frontend`)

The frontend is a [Vite](https://vitejs.dev/) powered [React](https://react.dev/) application built with [TypeScript](https://www.typescriptlang.org/) and styled using [Tailwind CSS](https://tailwindcss.com/) and [ShadCN UI](https://ui.shadcn.com/). It uses [TanStack Router](https://tanstack.com/router/v1) for routing.

```
apps/frontend/
├── src/
│   ├── components/     # Reusable React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and helpers
│   ├── routes/         # TanStack Router route components
│   ├── types/          # TypeScript type definitions
│   ├── index.css       # Global styles
│   └── main.tsx        # Main entry point of the React app
└── package.json
```

- **`src/main.tsx`**: The main entry point of the application where the React application is rendered and the TanStack Router is initialized.
- **`src/routes/`**: This directory contains the route components for the application. TanStack Router uses a file-based routing system, where each file in this directory represents a route.
- **`src/components/`**: Contains reusable React components. It's common to have subfolders for different categories of components (e.g., `ui` for ShadCN components, `layout` for page layouts, `forms` for form elements).
- **`src/lib/`**: A place for utility functions, helper scripts, and library configurations. For example, you might have a `lib/utils.ts` for general helper functions or `lib/axios.ts` for configuring an Axios instance for API calls.
- **`src/hooks/`**: This folder is for custom React hooks that encapsulate and reuse stateful logic. For example, a `useApi.ts` hook could simplify making API requests.
- **`src/types/`**: Contains all shared TypeScript type definitions and interfaces, especially for API request/response payloads.
- **`src/index.css`**: Holds global CSS files, such as for Tailwind CSS base styles.

## ⚙️ Backend Structure (`apps/backend`)

The backend is a [FastAPI](https://fastapi.tiangolo.com/) application that uses [Pydantic](https://docs.pydantic.dev/) for data validation and [Uvicorn](https://www.uvicorn.org/) as the ASGI server.

```
apps/backend/
├── src/
│   ├── main.py         # FastAPI app initialization
│   ├── api/            # API-related modules
│   │   ├── routes/     # API route definitions
│   │   └── dependencies.py # Shared API dependencies
│   ├── services/       # Business logic
│   ├── models/         # Pydantic data models/schemas
│   ├── db/             # Database connection and session management
│   └── core/           # Core configuration and settings
├── pyproject.toml
└── uv.lock
```

- **`src/main.py`**: The entry point of the FastAPI application. It initializes the FastAPI app, includes API routers, and sets up middleware.
- **`src/api/`**: A package for all API-related code.
    - **`routes/`**: Contains the API routers. Each file typically corresponds to a resource (e.g., `users.py`, `tasks.py`).
    - **`dependencies.py`**: For shared dependencies that can be injected into routes, such as authentication checks or database sessions.
- **`src/services/`**: This is where the core business logic resides. API routes should call service functions to perform actions, keeping the route handlers thin and focused on handling the HTTP request/response cycle.
- **`src/models/`**: Contains Pydantic models (schemas) for data validation of API request and response bodies.
- **`src/db/`**: For database-related code, including database session management and engine creation.
- **`src/core/`**: Holds the core application settings and configuration, such as environment variables loaded from a `.env` file.

## 🔗 Frontend ↔ Backend Communication

The frontend and backend communicate via a REST API.

- **Backend**: The FastAPI backend exposes RESTful endpoints (e.g., `GET /api/users`, `POST /api/tasks`).
- **Frontend**: The React frontend uses a library like `axios` or the built-in `fetch` API to make HTTP requests to the backend's endpoints.

During development, the Vite development server can be configured to proxy requests to the FastAPI backend to avoid CORS issues.

## 🪄 Example: Adding a New Route and Using It

Here’s a step-by-step example of adding a `/api/tasks` route to the backend and calling it from the frontend.

### 1. Add a New Backend Route

**a. Create a Pydantic model (`src/models/task.py`):**

```python
from pydantic import BaseModel

class Task(BaseModel):
    id: int
    title: str
    completed: bool
```

**b. Create a new route file (`src/api/routes/tasks.py`):**

```python
from fastapi import APIRouter
from src.models.task import Task

router = APIRouter()

@router.get("/tasks", response_model=list[Task])
def get_tasks():
    # In a real app, you would fetch this from a service/database
    return [
        {"id": 1, "title": "Learn FastAPI", "completed": True},
        {"id": 2, "title": "Build a cool app", "completed": False},
    ]
```

**c. Include the new router in `src/main.py`:**

```python
from fastapi import FastAPI
from src.api.routes import tasks, health, users # Import the new router

app = FastAPI()

app.include_router(health.router, tags=["Health"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"]) # Include the new router
```

### 2. Use the New Route in the Frontend

**a. Add the new type to `src/types/index.ts`:**

```typescript
export interface Task {
  id: number;
  title: string;
  completed: boolean;
}
```

**b. Create a custom hook to fetch the tasks (`src/hooks/useTasks.ts`):**

```typescript
import { useState, useEffect } from 'react';
import { Task } from '../types';
import axios from 'axios';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await axios.get<Task[]>('/api/tasks');
        setTasks(response.data);
      } catch (err) {
        setError('Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  return { tasks, loading, error };
}
```

**c. Use the hook in a route component (`src/routes/tasks.tsx`):**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks';

export const Route = createFileRoute('/tasks')({
  component: TasksComponent,
})

function TasksComponent() {
  const { tasks, loading, error } = useTasks();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Tasks</h1>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
}
```