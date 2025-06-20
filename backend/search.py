import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import re

def highlight_match(text, query):
    """Wrap full-word matches of query in <mark> tags."""
    words = [re.escape(w) for w in query.strip().split() if w]
    if not words:
        return text
    pattern = r'\b(' + '|'.join(words) + r')\b'
    return re.sub(pattern, r'<mark>\1</mark>', text, flags=re.IGNORECASE)

def search(query_embedding, config, query: str = "", top_k=5):
    index_path = f"{config['index_folder']}/embeddings.json"
    with open(index_path, 'r') as f:
        data = json.load(f)

    if not data:
        return [{"filename": "", "text": "No embeddings found. Please run indexing.", "score": -1.0}]

    embeddings = np.array([item['embedding'] for item in data])

    if embeddings.ndim != 2:
        return [{"filename": "", "text": "Embedding format error. Re-run indexing.", "score": -1.0}]

    scores = cosine_similarity([query_embedding], embeddings).flatten()
    top_indices = scores.argsort()[::-1][:top_k]

    min_score = config.get("min_score", 0.15)  # Use from config, default fallback

    results = []
    for i in top_indices:
        item = data[i]
        score = float(scores[i])
        if score < min_score:
            continue
        results.append({
            "filename": item["filename"],
            "chunk_id": item.get("chunk_id", -1),
            "text": item["text"],
            "highlighted": highlight_match(item["text"], query),
            "score": round(score, 4)
        })

    if not results:
        return [{"filename": "", "text": "No good match found.", "score": -1.0}]

    return results
