import os
import re
import json
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from sklearn.metrics.pairwise import cosine_similarity

def highlight_match(text: str, query: str, window: int = 400) -> str:
    words = [re.escape(w) for w in query.strip().split() if w]
    if not words:
        return text[:window] + ("..." if len(text) > window else "")

    pattern = re.compile(r'\b(' + '|'.join(words) + r')\b', flags=re.IGNORECASE)
    match = pattern.search(text)

    if not match:
        return text[:window] + ("..." if len(text) > window else "")

    start = max(match.start() - window // 2, 0)
    end = min(match.end() + window // 2, len(text))

    snippet = text[start:end]

    # Add ellipsis if we trimmed either side
    if start > 0:
        snippet = '...' + snippet
    if end < len(text):
        snippet = snippet + '...'

    # Highlight the matched terms
    snippet = pattern.sub(r'<mark>\1</mark>', snippet)

    return snippet


def search(query_embedding, config, query: str = "", top_k=5):
    index_path = os.path.join(config['index_folder'], 'embeddings.json')
    with open(index_path, 'r') as f:
        data = json.load(f)

    if not data:
        return {
            "fileMatch": [],
            "embedMatch": [{"filename": "", "text": "No embeddings found. Please run indexing.", "score": -1.0}]
        }

    min_score = config.get("min_score", 0.15)
    query_lower = query.lower()

    # -------- 1. File name based search --------
    seen_files = set()
    file_matches = []
    for item in data:
        path = item['filename']
        if query_lower in os.path.basename(path).lower() or re.fullmatch(query_lower, os.path.basename(path), flags=re.IGNORECASE):
            if path not in seen_files:
                file_matches.append({ "filename": os.path.abspath(path) })
                seen_files.add(path)

    # -------- 2. Embedding-based search --------
    embeddings = np.array([item['embedding'] for item in data])
    if embeddings.ndim != 2:
        return {
            "fileMatch": file_matches,
            "embedMatch": [{"filename": "", "text": "Embedding format error. Re-run indexing.", "score": -1.0}]
        }

    def score_item(i):
        item = data[i]
        score = float(cosine_similarity([query_embedding], [item["embedding"]])[0][0])
        if score < min_score:
            return None
        return {
            "filename": item["filename"],
            "chunk_id": item.get("chunk_id", -1),
            "text": item["text"],
            "highlighted": highlight_match(item["text"], query),
            "score": round(score, 4)
        }

    indices = list(range(len(data)))
    results = []
    with ThreadPoolExecutor() as executor:
        for res in executor.map(score_item, indices):
            if res:
                results.append(res)

    results = sorted(results, key=lambda x: x["score"], reverse=True)[:top_k]

    return {
        "fileMatch": file_matches,
        "embedMatch": results or [{"filename": "", "text": "No good match found.", "score": -1.0}]
    }
