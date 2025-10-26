#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Building Video Downloader"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
ELECTRON_DIR="$ROOT_DIR/electron"

TARGET_PLATFORM="${1:-current}"  # default: build for current platform only

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

# Create cache directory for runtime files
CACHE_DIR="$HOME/.cache/video-downloader-backend"
mkdir -p "$CACHE_DIR"

# Log cache directory info
echo "Using runtime cache directory: $CACHE_DIR"
if [ -d "$CACHE_DIR" ]; then
  echo "Cache directory exists with $(ls -la "$CACHE_DIR" | wc -l) items"
fi

# Build with pyinstaller using optimization flags
if [ "${DEBUG_BUILD:-false}" = "true" ]; then
  # Debug build with --onedir for faster startup
  echo "🔧 Building backend with --onedir for faster local testing..."
  pyinstaller --onedir main.py --name backend_main --distpath "$BACKEND_DIR/dist" \
    --noconfirm --clean

  # Log build details
  echo "✅ Built with --onedir for fast startup during development"
  echo "   This build will start much faster but creates a larger package"
elif [ "${ONEDIR_BUILD:-true}" = "true" ]; then
  # Production build with --onedir for faster startup (default)
  echo "⚡ Building backend with --onedir for faster production startup..."
  pyinstaller --onedir main.py --name backend_main --distpath "$BACKEND_DIR/dist" \
    --noconfirm --clean --strip

  echo "✅ Built with --onedir and strip for fast startup in production"
  echo "   This build will start much faster but creates a larger package"
else
  # Check if we want to try --noupx for comparison
  if [ "${NO_UPX:-false}" = "true" ]; then
    # Production build with --onefile and optimizations but without UPX
    echo "⚡ Building backend with --onefile and optimizations (no UPX)..."
    pyinstaller --onefile main.py --name backend_main --distpath "$BACKEND_DIR/dist" \
      --noconfirm --clean --strip \
      --runtime-tmpdir "$CACHE_DIR"

    echo "✅ Built with --onefile, strip, and runtime caching (no UPX)"
  else
    # Production build with --onefile and all optimizations
    echo "⚡ Building backend with --onefile and all optimizations (including UPX)..."
    pyinstaller --onefile main.py --name backend_main --distpath "$BACKEND_DIR/dist" \
      --noconfirm --clean --strip --upx-dir /opt/homebrew/bin/upx \
      --runtime-tmpdir "$CACHE_DIR"

    echo "✅ Built with --onefile, strip, UPX, and runtime caching"
  fi

  # Log optimization details
  echo "   Using runtime cache directory: $CACHE_DIR"
  echo "   This enables faster subsequent startups by caching extracted files"
fi

# Check if build was successful
if [ "${DEBUG_BUILD:-false}" = "true" ] || [ "${ONEDIR_BUILD:-true}" = "true" ]; then
  BIN_PATH="$BACKEND_DIR/dist/backend_main/backend_main"
else
  BIN_PATH="$BACKEND_DIR/dist/backend_main"
fi

if [[ ! -f "$BIN_PATH" ]]; then
  echo "❌ PyInstaller failed to create backend executable"
  exit 1
fi

chmod +x "$BIN_PATH"
echo "✅ Backend binary created at: $BIN_PATH"

# Show file size for comparison
echo "📁 Backend binary size: $(du -h "$BIN_PATH" | cut -f1)"
popd >/dev/null

# ──────────────────────────────── 3. Electron
echo "⚡ Building Electron app for target: $TARGET_PLATFORM"
pushd "$ELECTRON_DIR" >/dev/null

if [ ! -d node_modules ]; then
  echo "📦 Installing Electron dependencies..."
  npm ci
fi

case "$TARGET_PLATFORM" in
  mac) npm run build:mac-universal ;;
  mac-arm64) npm run build:mac-arm64 ;;
  mac-x64) npm run build:mac-x64 ;;
  win) npm run build:win ;;
  linux) npm run build:linux ;;
  all) npm run build:all ;;
  *) npm run build:electron ;; # Default for current platform
esac

popd >/dev/null

echo "🎉 Build complete!"
echo "────────────────────────────────────────────"
echo "📁  Frontend → $FRONTEND_DIR/dist/"
echo "🐍  Backend  → $BACKEND_DIR/dist/backend_main"
echo "⚡  Electron → $ELECTRON_DIR/dist/"
echo "────────────────────────────────────────────"
