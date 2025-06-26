
Index your files for quick search. Runs locally!

---

# DEV

There are two portions - backend which does heavy lifting creating embeddings and frontend which communicates using rest APIs.

### Backend:

pip3 install fastapi uvicorn python-docx beautifulsoup4 sentence-transformers scikit-learn pytesseract pillow pdfplumber
brew install tesseract
chmod +x start-backend.sh

### Frontend:

npm install
chmod +x start-frontend.sh


### Run

```
./start-frontend.sh
./start-backend.sh
```

---


# BUILD - PROD BUILD

Prod build creates a .dmg file that can be installed.

```
./build.sh
```

And then, Ctrl + Space or Cmd + Space shows/hides the search!


