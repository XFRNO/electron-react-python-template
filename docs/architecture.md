# Architecture

This project follows a modular architecture, with a clear separation of concerns between the different parts of the application. The monorepo is managed by Turborepo, which allows for efficient building and testing of the individual apps and packages.

## Monorepo Structure

The repository is organized as follows:

```
/
├── apps/
│   ├── electron/   # Electron main process and window management
│   ├── frontend/   # React frontend application
│   └── backend/    # FastAPI backend server
├── packages/
│   ├── ...         # Shared packages (e.g., UI components, utils)
├── docs/
│   └── ...         # Project documentation
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Application Flow

1.  **Electron App**: The `electron` app is the main entry point of the application. It creates the main browser window and loads the React frontend.
2.  **Python Backend**: The Electron main process spawns the Python backend as a child process. This ensures that the backend is running whenever the Electron app is open.
3.  **React Frontend**: The `frontend` app is a standard React application that runs in the Electron browser window. It communicates with the Python backend via HTTP requests to the FastAPI server.

## Communication

- **Frontend to Backend**: The frontend communicates with the backend by making API calls to the FastAPI server. The server address is provided to the frontend via the Electron preload script.
- **Electron to Backend**: The Electron main process can communicate with the backend via standard input/output or by using a more advanced IPC mechanism if needed.
- **Electron to Frontend**: The Electron main process and the frontend can communicate using Electron's `ipcMain` and `ipcRenderer` modules.
