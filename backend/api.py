from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import os, json
from backend.config import load_config
from backend.search import search

app = FastAPI()
model = None

class SearchHit(BaseModel):
    filename: str
    paragraph: str

class SearchResponse(BaseModel):
    results: list[dict]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.on_event("startup")
def load_model():
    global model
    config = load_config()
    model = SentenceTransformer(config["embedding_model"])


# inside /search endpoint
@app.get("/search", response_model=SearchResponse)
def search_endpoint(q: str = Query(..., min_length=1)):
    config = load_config()
    index_path = os.path.join(config["index_folder"], "embeddings.json")
    if not os.path.exists(index_path):
        raise HTTPException(status_code=404, detail="Index not found. Please run /reindex.")

    try:
        query_embedding = model.encode(q)
        result = search(query_embedding, config)
        return {"results": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/reindex")
def reindex():
    from backend.indexer import run_indexing
    run_indexing()
    return {"status": "Indexing complete"}

@app.get("/config")
def get_config():
    return load_config()

@app.post("/config")
def update_config(new_config: dict):
    import json
    with open("config.json", "w") as f:
        json.dump(new_config, f, indent=2)
    return {"status": "Config updated"}