

#!/bin/bash

echo "🔧 Installing backend dependencies..."
pip3 install \
  fastapi \
  uvicorn \
  python-docx \
  beautifulsoup4 \
  sentence-transformers \
  scikit-learn \
  pytesseract \
  pillow \
  pdfplumber

echo "Installing Tesseract (for OCR)..."
if command -v brew &> /dev/null; then
  brew install tesseract
else
  echo "Homebrew not found. Please install Tesseract manually."
fi

echo "Setting backend script executable..."
chmod +x start-backend.sh

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Setting frontend script executable..."
chmod +x start-frontend.sh

echo "Setup complete!"
