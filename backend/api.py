from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
import os, json
import subprocess
import platform
from contextlib import asynccontextmanager

from backend.config import load_config
from backend.search import search

model = None  # global model

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    config = load_config()
    model = SentenceTransformer(config["embedding_model"])
    yield  # Application runs here
    # Cleanup code (if needed) goes here

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchHit(BaseModel):
    filename: str
    paragraph: str

class SearchResponse(BaseModel):
    results: list[dict]

class FilePath(BaseModel):
    path: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/search", response_model=dict)
def search_endpoint(q: str = Query(..., min_length=1)):
    config = load_config()
    index_path = os.path.join(config["index_folder"], "embeddings.json")
    if not os.path.exists(index_path):
        raise HTTPException(status_code=404, detail="Index not found. Please run /reindex.")

    try:
        query_embedding = model.encode(q)
        result = search(query_embedding, config, query=q)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/reindex")
def reindex():
    from backend.indexer import run_indexing
    count = run_indexing()
    if count == 0:
        return {"status": "No files to index."}
    return {"status": f"{count} file{'s' if count != 1 else ''} indexed."}

@app.get("/config")
def get_config():
    return load_config()

@app.post("/config")
def update_config(new_config: dict):
    with open("config.json", "w") as f:
        json.dump(new_config, f, indent=2)
    return {"status": "Config updated"}

@app.post("/open-folder")
def open_folder(fp: FilePath):
    path = fp.path
    folder = path if os.path.isdir(path) else os.path.dirname(path)
    if platform.system() == "Darwin":  # macOS
        subprocess.run(["open", folder])
    elif platform.system() == "Windows":
        subprocess.run(["explorer", folder])
    elif platform.system() == "Linux":
        subprocess.run(["xdg-open", folder])
    else:
        raise Exception("Unsupported OS")
    return {"status": "opened"}
