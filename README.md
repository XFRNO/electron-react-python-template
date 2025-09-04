# Electron + React + Python Template

A complete template for building cross-platform desktop applications with:
- Frontend: React + Vite + TypeScript + TailwindCSS + Shadcn + TanStack Router & Query
- Backend: Python + FastAPI + Uvicorn
- Desktop: Electron

This project is intended as an open-source template. I'm still learning and figuring things out, so please bear with any imperfections. If you'd like to contribute, you're more than welcome to!

## Features

- Light and dark themes with system preference detection
- Cross-platform support (Windows, macOS, Linux)
- Proper application shutdown (closes both frontend and backend)
- Development and production modes
- Build script for packaging the entire application
- API communication between frontend and backend

## Project Structure

```
.
├── frontend/          # React + Vite frontend
├── backend/           # Python FastAPI backend
├── electron/          # Electron wrapper
└── build.sh           # Build script
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- Python 3.7 or higher
- npm

### Setup

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set up Python virtual environment and install dependencies:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Install Electron dependencies:
   ```bash
   cd electron
   npm install
   ```

### Running in Development Mode

```bash
cd electron
npm run dev
```

This will start:
1. The React development server (Vite)
2. The Python FastAPI backend
3. The Electron application

### Building for Production

```bash
./build.sh
```

This will:
1. Build the React frontend
2. Package the Python backend
3. Create distributable Electron app

The build artifacts will be in `electron/dist/`.

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

I'm still learning and figuring things out, so if you see something that could be improved or want to add new features, feel free to contribute! Please open an issue or submit a pull request.

## License

MIT