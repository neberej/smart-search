import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def search(query_embedding, config, top_k=5):
    with open(f"{config['index_folder']}/embeddings.json", 'r') as f:
        data = json.load(f)

    if not data:
        return ["No embeddings found. Please run indexing."]

    embeddings = np.array([item['embedding'] for item in data])
    if embeddings.ndim != 2:
        return ["Embedding format error. Re-run indexing."]

    scores = cosine_similarity([query_embedding], embeddings).flatten()
    top_indices = scores.argsort()[::-1][:top_k]
    results = [data[i]['filename'] for i in top_indices]
    return results