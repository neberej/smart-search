from fastapi import FastAPI, Query
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from backend.config import load_config
from backend.search import search

app = FastAPI()
model = None

class SearchResponse(BaseModel):
    results: list

@app.on_event("startup")
def load_model():
    global model
    config = load_config()
    model = SentenceTransformer(config["embedding_model"])

@app.get("/search", response_model=SearchResponse)
def search_endpoint(q: str = Query(...)):
    config = load_config()
    query_embedding = model.encode(q)
    result_files = search(query_embedding, config)
    return {"results": result_files}

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