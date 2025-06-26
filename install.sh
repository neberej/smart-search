#!/bin/bash

echo "Installing backend Python dependencies..."
pip3 install \
  fastapi \
  uvicorn \
  python-docx \
  beautifulsoup4 \
  sentence-transformers \
  scikit-learn \
  pytesseract \
  pillow \
  pyinstaller \
  scipy \
  transformers \
  torch \
  faiss-cpu \
  PyPDF2 \
  lxml

echo "Installing system dependencies..."
if command -v brew &> /dev/null; then
  brew install tesseract openblas
else
  echo "Homebrew not found. Please install Tesseract and OpenBLAS manually."
fi

echo "Setting backend script executable..."
chmod +x start-backend.sh

echo "Installing frontend Node dependencies..."
cd frontend
npm install
cd ..

echo "Setting frontend script executable..."
chmod +x start-frontend.sh

echo "Setup complete!"