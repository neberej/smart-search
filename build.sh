#!/bin/bash
set -e

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ROOT_DIR=$(pwd)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
DIST_APP_DIR="$ROOT_DIR/dist-app"
DIST_ELECTRON_DIR="$ROOT_DIR/dist_electron"
ELECTRON_DIST_DIR="$FRONTEND_DIR/electron-dist"
BACKEND_BINARY_NAME="smartsearch-backend"
BACKEND_BINARY_PATH="$BACKEND_DIR/dist/$BACKEND_BINARY_NAME/$BACKEND_BINARY_NAME"

echo -e "${BLUE}Step 1 of 7: Cleaning old dist folders...${NC}"
rm -rf "$BACKEND_DIR/dist" "$BACKEND_DIR/build" "$FRONTEND_DIR/build" "$ELECTRON_DIST_DIR" "$DIST_APP_DIR" "$DIST_ELECTRON_DIR"
mkdir -p "$DIST_APP_DIR/backend"

echo -e "${BLUE}Step 2 of 7: Killing any process on port 8001...${NC}"
if lsof -i :8001 -t >/dev/null; then
  kill -9 $(lsof -i :8001 -t)
  echo "Killed process on port 8001"
else
  echo "No process found on port 8001"
fi

echo -e "${BLUE}Step 3 of 7: Building backend...${NC}"
source "$ROOT_DIR/venv/bin/activate"
cd "$BACKEND_DIR"
pyinstaller backend.spec
[[ -f "$BACKEND_BINARY_PATH" ]] || { echo -e "${RED}Backend binary not found${NC}"; exit 1; }

echo -e "${BLUE}Step 4 of 7: Building frontend and compiling Electron...${NC}"
cd "$FRONTEND_DIR"
npm install
npm run build
npm run compile-electron

echo -e "${BLUE}Step 5 of 7: Creating package.json...${NC}"
mkdir -p "$ELECTRON_DIST_DIR"
cat > "$DIST_APP_DIR/package.json" <<EOF
{
  "name": "smartsearch-electron",
  "version": "1.0.0",
  "main": "electron-dist/main.js"
}
EOF

echo -e "${BLUE}Step 6 of 7: Copying backend binary to dist-app...${NC}"
cp -r "$BACKEND_DIR/dist/$BACKEND_BINARY_NAME" "$DIST_APP_DIR/backend/"
chmod +x "$DIST_APP_DIR/backend/$BACKEND_BINARY_NAME/$BACKEND_BINARY_NAME"


echo -e "${BLUE}Step 7 of 7: Running electron-builder...${NC}"
cd "$FRONTEND_DIR"
npx electron-builder --config electron-builder.json

echo -e "${GREEN} All done!! DMG located in: $DIST_ELECTRON_DIR${NC}"
