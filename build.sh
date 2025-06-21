#!/bin/bash
set -e

ROOT_DIR=$(pwd)
FRONTEND_DIR="$ROOT_DIR/frontend"
DIST_APP_DIR="$ROOT_DIR/dist-app"

echo "Step 1: Cleaning previous builds..."
rm -rf "$FRONTEND_DIR/build"
rm -rf "$DIST_APP_DIR"
rm -rf "$FRONTEND_DIR/dist_electron"

echo "Step 2: Building React app..."
cd "$FRONTEND_DIR"
npm install
npm run build

echo "Step 3: Compiling Electron..."
npx tsc -p tsconfig.json

if [ ! -f "$FRONTEND_DIR/electron-dist/main.js" ]; then
  echo "main.js not found in electron-dist/. Check tsconfig paths and entry file."
  exit 1
fi

echo "Step 4: Preparing dist-app folder..."
mkdir -p "$DIST_APP_DIR"
cp -r "$FRONTEND_DIR/electron-dist/"* "$DIST_APP_DIR/"
cp -r "$FRONTEND_DIR/build" "$DIST_APP_DIR/build"

echo "Step 5: Creating minimal package.json..."
cat > "$DIST_APP_DIR/package.json" <<EOF
{
  "name": "smart-search",
  "version": "1.0.0",
  "main": "main.js",
  "description": "SmartSearch Electron App",
  "author": "Your Name"
}
EOF

echo "Step 6: Packaging with electron-builder..."
cd "$FRONTEND_DIR"
npx electron-builder --config frontend/electron-builder.json --projectDir="$ROOT_DIR"

echo "Step 7: Cleaning up temporary dist-app folder..."
rm -rf "$DIST_APP_DIR"

echo "Done. Packaged app is in /dist_electron folder"
