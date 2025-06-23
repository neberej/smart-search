#!/bin/bash

set -e

echo "Step 1: Setting variables..."
ROOT_DIR=$(pwd)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
DIST_APP_DIR="$ROOT_DIR/dist-app"
BACKEND_BINARY_NAME="smartsearch-backend"
BACKEND_BINARY_PATH="$BACKEND_DIR/dist/$BACKEND_BINARY_NAME/$BACKEND_BINARY_NAME"

echo "Step 2: Verifying Python environment..."
source "$ROOT_DIR/venv/bin/activate"
python3 --version
pip3 --version

echo "Step 3: Building backend..."
cd "$BACKEND_DIR"
rm -rf dist build
pyinstaller backend.spec
ls -l "$BACKEND_BINARY_PATH"

echo "Step 4: Verifying backend dist structure..."
if [ -d "$BACKEND_DIR/dist/$BACKEND_BINARY_NAME" ]; then
  echo "Backend dist directory found: $BACKEND_DIR/dist/$BACKEND_BINARY_NAME"
  ls -l "$BACKEND_DIR/dist/$BACKEND_BINARY_NAME/"
  if [ -f "$BACKEND_BINARY_PATH" ]; then
    echo "Executable found: $BACKEND_BINARY_PATH"
  else
    echo "Error: Executable not found at $BACKEND_BINARY_PATH"
    exit 1
  fi
else
  echo "Error: Backend dist directory not found at $BACKEND_DIR/dist/$BACKEND_BINARY_NAME"
  exit 1
fi

echo "Step 5: Verifying Python shared library..."
python_lib_path=$(python3 -c "import sysconfig; print(sysconfig.get_config_var('LIBDIR'))")
python_lib_name=$(python3 -c "import sysconfig; print(sysconfig.get_config_var('LDLIBRARY'))")
lib_path="$python_lib_path/$python_lib_name"
if [ -L "$lib_path" ]; then
  python_lib_real=$(readlink -f "$lib_path")
else
  python_lib_real="$lib_path"
fi
if [ ! -f "$python_lib_real" ]; then
  python_lib_real="/opt/homebrew/opt/python@3.13/Frameworks/Python.framework/Versions/3.13/lib/libpython3.13.dylib"
fi
if [ -f "$python_lib_real" ]; then
  echo "Python shared library found: $python_lib_real"
else
  echo "Error: Python shared library not found at $python_lib_real"
  exit 1
fi

echo "Step 6: Preparing dist-app folder..."
mkdir -p "$DIST_APP_DIR"
mkdir -p "$DIST_APP_DIR/backend"

echo "Step 6.1: Cleaning stale smartsearch-backend file if exists..."
if [ -f "$DIST_APP_DIR/backend/$BACKEND_BINARY_NAME" ]; then
  echo "Warning: $DIST_APP_DIR/backend/$BACKEND_BINARY_NAME exists as a file. Removing..."
  rm -f "$DIST_APP_DIR/backend/$BACKEND_BINARY_NAME"
fi

cp -r "$FRONTEND_DIR/electron-dist/"* "$DIST_APP_DIR/"
cp -r "$FRONTEND_DIR/build" "$DIST_APP_DIR/build"


# Copy the entire smartsearch-backend directory to dist-app/backend/
cp -r "$BACKEND_DIR/dist/$BACKEND_BINARY_NAME" "$DIST_APP_DIR/backend/"
chmod +x "$DIST_APP_DIR/backend/$BACKEND_BINARY_NAME/$BACKEND_BINARY_NAME"

echo "Verifying backend binary in dist-app..."
ls -l "$DIST_APP_DIR/backend/$BACKEND_BINARY_NAME/"

echo "Step 7: Building Electron app..."
cd "$FRONTEND_DIR"
npm run electron-build

echo "Step 8: Cleaning up unnecessary folders..."
rm -rf "$BACKEND_DIR/dist" "$BACKEND_DIR/build"
rm -rf "$FRONTEND_DIR/electron-dist"
echo "Cleanup complete. Output is in $DIST_APP_DIR"

echo "Build complete!"