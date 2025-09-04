# Electron React Python Template - Summary

This template provides a complete foundation for building cross-platform desktop applications with:

## Technology Stack

### Frontend
- **Vite + React + TypeScript**: Fast development environment
- **TailwindCSS**: Utility-first CSS framework (v4)
- **Shadcn**: Reusable component library
- **TanStack Router**: Type-safe routing solution
- **TanStack Query**: Server state management

### Backend
- **Python FastAPI**: Modern, fast web framework
- **Uvicorn**: ASGI server implementation
- **Virtual Environment**: Isolated Python dependencies

### Desktop
- **Electron**: Cross-platform desktop application framework

## Features Implemented

1. **Light and Dark Themes**: With system preference detection and manual toggle
2. **Cross-Platform Support**: Works on Windows, macOS, and Linux
3. **Proper Application Shutdown**: Closes both frontend and backend cleanly when the window is closed
4. **Development and Production Modes**: 
   - Development: Hot reloading for frontend and backend
   - Production: Packaged Electron app with bundled frontend and backend
5. **Build Script**: Automated build process for all components
6. **API Communication**: Frontend can communicate with Python backend via HTTP

## Project Structure

```
.
├── frontend/          # React + Vite frontend
│   ├── src/           # Source code
│   ├── components/    # Reusable components
│   ├── routes/        # Application routes
│   └── dist/          # Built frontend assets
├── backend/           # Python FastAPI backend
│   ├── venv/          # Python virtual environment
│   ├── main.py        # Main application file
│   └── requirements.txt # Python dependencies
├── electron/          # Electron wrapper
│   ├── main.js        # Main Electron process
│   ├── preload.js     # Preload script for secure IPC
│   └── dist/          # Packaged Electron app
├── build.sh           # Build script for all components
├── README.md          # Project documentation
└── SUMMARY.md         # This file
```

## How to Use

### Development Mode
```bash
cd electron
npm run dev
```

This will:
1. Start the React development server (Vite) on port 5173
2. Start the Python FastAPI backend on port 8001
3. Launch the Electron application

### Production Build
```bash
./build.sh
```

This will:
1. Build the React frontend
2. Package the Python backend
3. Create distributable Electron app in `electron/dist/`

## API Endpoints

- `GET /api/hello` - Returns a test message from the Python backend
- `GET /api/status` - Returns backend status information

## Technologies Used

### Frontend
- React 18
- Vite
- TypeScript
- TailwindCSS v4
- Shadcn UI components
- TanStack Router
- TanStack Query

### Backend
- Python 3.7+
- FastAPI
- Uvicorn

### Desktop
- Electron 29

## Customization

- Frontend port: 5173 (Vite default)
- Backend port: 8001 (can be configured with PORT environment variable)

## Contributing

This project is intended as an open-source template. I'm still learning and figuring things out, so please bear with any imperfections. If you'd like to contribute, you're more than welcome to! Please open an issue or submit a pull request.

## Key Implementation Details

1. **Clean Shutdown**: When the user clicks the close button (X), both the frontend and backend processes are properly terminated
2. **Theme Persistence**: User's theme preference is saved in localStorage
3. **CORS Configuration**: Backend is configured to accept requests from the frontend
4. **Error Handling**: Proper error handling in both frontend and backend
5. **Logging**: Comprehensive logging in the build script

This template provides a solid foundation for building desktop applications with modern web technologies while maintaining the performance and capabilities of native applications.