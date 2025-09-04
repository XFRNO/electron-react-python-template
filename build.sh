#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Building Electron React Python Template..."

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
ELECTRON_DIR="$ROOT_DIR/electron"

# ──────────────────────────────── 1. Frontend
echo "📦 Building React frontend (Vite)..."
pushd "$FRONTEND_DIR" >/dev/null

[ -d node_modules ] || npm ci
npm run build

popd >/dev/null
echo "✅ Frontend build complete (dist/)"

# ──────────────────────────────── 2. Backend
echo "🐍 Building Python backend..."
pushd "$BACKEND_DIR" >/dev/null

# ensure venv
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

# clean old builds
rm -rf build dist

# build with pyinstaller
pyinstaller --onefile main.py --name backend_main --distpath "$BACKEND_DIR/dist"

BIN_PATH="$BACKEND_DIR/dist/backend_main"
if [[ ! -f "$BIN_PATH" ]]; then
  echo "❌ PyInstaller failed to create backend executable"
  exit 1
fi
chmod +x "$BIN_PATH"
echo "✅ Backend binary created at: $BIN_PATH"
popd >/dev/null

# ──────────────────────────────── 3. Electron
echo "⚡ Building Electron app..."
pushd "$ELECTRON_DIR" >/dev/null

[ -d node_modules ] || npm ci
npm run build:electron

popd >/dev/null

echo "🎉 Build complete!"
echo "  • Frontend → $FRONTEND_DIR/dist/"
echo "  • Backend → $BACKEND_DIR/dist/backend_main"
echo "  • Electron → $ELECTRON_DIR/dist/"
