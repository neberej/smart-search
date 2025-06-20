import os
import re
import json
import numpy as np
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Optional, Generator
import logging
import faiss
import mmap

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def normalize_text(text: str) -> str:
    """Normalize text by removing special characters and extra whitespace."""
    try:
        return unicodedata.normalize('NFKD', text).replace('\n', ' ').replace('\r', ' ').strip()
    except Exception as e:
        logger.error(f"Error normalizing text: {e}")
        return text.strip()

def highlight_match(text: str, query: str, window: int = 400) -> str:
    """Highlight query matches in text with a context window."""
    try:
        normalized_text = normalize_text(text)
        normalized_query = normalize_text(query)

        words = [re.escape(w) for w in normalized_query.split() if w]
        if not words:
            return normalized_text[:window] + ("..." if len(normalized_text) > window else "")

        pattern = re.compile(r'\b(' + '|'.join(words) + r')\b', flags=re.IGNORECASE)
        match = pattern.search(normalized_text)

        if not match:
            return normalized_text[:window] + ("..." if len(normalized_text) > window else "")

        start = max(match.start() - window // 2, 0)
        end = min(match.end() + window // 2, len(normalized_text))
        snippet = normalized_text[start:end]

        if start > 0:
            snippet = '...' + snippet
        if end < len(normalized_text):
            snippet += '...'

        highlighted = pattern.sub(r'<mark>\1</mark>', snippet)
        return highlighted
    except Exception as e:
        logger.error(f"Error highlighting match: {e}")
        return normalized_text[:window] + ("..." if len(normalized_text) > window else "")

def stream_file_chunks(file_path: str, chunk_size: int = 1024) -> Generator[str, None, None]:
    """Stream large file in chunks to avoid loading into memory."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as mm:
                for i in range(0, len(mm), chunk_size):
                    yield mm[i:i + chunk_size].decode('utf-8', errors='ignore')
    except Exception as e:
        logger.error(f"Error streaming file {file_path}: {e}")
        yield ""

def load_embeddings_in_batches(index_path: str, batch_size: int = 1000) -> Generator[tuple[np.ndarray, List[Dict]], None, None]:
    """Load embeddings in batches to reduce memory usage."""
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            embeddings = np.array([item['embedding'] for item in batch if 'embedding' in item], dtype=np.float32)
            if embeddings.size > 0:
                yield embeddings, batch
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {index_path}: {e}")
        yield np.array([]), []
    except Exception as e:
        logger.error(f"Error loading embeddings from {index_path}: {e}")
        yield np.array([]), []

def build_faiss_index(embeddings: np.ndarray) -> faiss.IndexFlatL2:
    """Build a FAISS index for faster similarity search."""
    try:
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings)
        return index
    except Exception as e:
        logger.error(f"Error building FAISS index: {e}")
        return None

def search(query_embedding: np.ndarray, config: Dict, query: str = "", top_k: int = 5) -> Dict:
    """Search files and embeddings for query matches with hybrid scoring."""
    try:
        index_path = os.path.join(config['index_folder'], 'embeddings.json')
        min_score = config.get("min_score", 0.05)  # Lowered threshold
        query_lower = query.lower()
        results = []
        file_matches = []
        seen_files = set()

        # File name-based search
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            for item in data:
                path = item.get('filename', '')
                if not path:
                    continue
                if query_lower in os.path.basename(path).lower() or re.fullmatch(query_lower, os.path.basename(path), flags=re.IGNORECASE):
                    if path not in seen_files:
                        file_matches.append({"filename": os.path.abspath(path)})
                        seen_files.add(path)
        except Exception as e:
            logger.error(f"Error in file name search: {e}")

        # Embedding-based search with keyword boosting
        use_faiss = config.get("use_faiss", False)
        if use_faiss:
            try:
                embeddings, data = next(load_embeddings_in_batches(index_path, batch_size=10000))
                if embeddings.size == 0:
                    return {
                        "fileMatch": file_matches,
                        "embedMatch": [{"filename": "", "text": "No embeddings found. Please run indexing.", "score": -1.0}]
                    }
                index = build_faiss_index(embeddings)
                if index:
                    distances, indices = index.search(np.array([query_embedding], dtype=np.float32), top_k)
                    for idx, distance in zip(indices[0], distances[0]):
                        score = 1 / (1 + distance)
                        item = data[idx]
                        # Keyword boost: +0.1 if query appears in text
                        keyword_boost = 0.1 if query_lower in normalize_text(item["text"]).lower() else 0
                        score += keyword_boost
                        logger.info(f"FAISS score for {item['filename']}: {score} (base: {1/(1+distance)}, boost: {keyword_boost})")
                        if score < min_score:
                            continue
                        results.append({
                            "filename": item["filename"],
                            "chunk_id": item.get("chunk_id", -1),
                            "text": item["text"],
                            "highlighted": highlight_match(item["text"], query),
                            "score": round(float(score), 4)
                        })
            except Exception as e:
                logger.error(f"FAISS search failed, falling back to cosine similarity: {e}")
                use_faiss = False

        if not use_faiss:
            def score_item(item: Dict, idx: int) -> Optional[Dict]:
                try:
                    score = float(cosine_similarity([query_embedding], [item["embedding"]])[0][0])
                    # Keyword boost: +0.1 if query appears in text
                    keyword_boost = 0.1 if query_lower in normalize_text(item["text"]).lower() else 0
                    score += keyword_boost
                    logger.info(f"Cosine score for {item['filename']}: {score} (base: {score-keyword_boost}, boost: {keyword_boost})")
                    if score < min_score:
                        return None
                    return {
                        "filename": item["filename"],
                        "chunk_id": item.get("chunk_id", -1),
                        "text": item["text"],
                        "highlighted": highlight_match(item["text"], query),
                        "score": round(score, 4)
                    }
                except Exception as e:
                    logger.error(f"Error scoring item {idx}: {e}")
                    return None

            with ThreadPoolExecutor() as executor:
                for embeddings, batch_data in load_embeddings_in_batches(index_path):
                    if embeddings.size == 0:
                        continue
                    scores = cosine_similarity([query_embedding], embeddings)[0]
                    futures = [executor.submit(score_item, batch_data[i], i) for i in range(len(batch_data))]
                    for future in futures:
                        res = future.result()
                        if res:
                            results.append(res)

        results = sorted(results, key=lambda x: x["score"], reverse=True)[:top_k]
        return {
            "fileMatch": file_matches,
            "embedMatch": results or [{"filename": "", "text": "No good match found.", "score": -1.0}]
        }
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return {
            "fileMatch": [],
            "embedMatch": [{"filename": "", "text": f"Search error: {str(e)}", "score": -1.0}]
        }

def index_large_file(file_path: str, index_path: str, embedding_model, chunk_size: int = 1024):
    """Index large files by streaming chunks and generating embeddings."""
    try:
        data = []
        chunk_id = 0
        for chunk in stream_file_chunks(file_path, chunk_size):
            if not chunk:
                continue
            embedding = embedding_model.encode([chunk])[0]
            data.append({
                "filename": file_path,
                "chunk_id": chunk_id,
                "text": chunk,
                "embedding": embedding.tolist()
            })
            chunk_id += 1
        with open(index_path, 'a', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Error indexing file {file_path}: {e}")