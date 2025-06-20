import os
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

def embed_documents(chunks, config):
    try:
        model = SentenceTransformer(config.get('embedding_model', 'multi-qa-MiniLM-L6-cos-v1'))
        batch_size = config.get('batch_size', 32)  # Process in batches
        texts = [chunk['text'] for chunk in chunks]
        embeddings = []
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_embeddings = model.encode(batch_texts, convert_to_tensor=False, show_progress_bar=False)
            embeddings.extend(batch_embeddings)
        return [
            {
                'filename': os.path.abspath(chunk['filename']),
                'chunk_id': chunk['chunk_id'],
                'text': chunk['text'],
                'embedding': emb.tolist()
            }
            for chunk, emb in zip(chunks, embeddings)
        ]
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        return []