import os
from sentence_transformers import SentenceTransformer

def embed_documents(chunks, config):
    model = SentenceTransformer(config['embedding_model'])
    texts = [chunk['text'] for chunk in chunks]
    embeddings = model.encode(texts, convert_to_tensor=False)
    return [
        {
            'filename': os.path.abspath(chunk['filename']),
            'chunk_id': chunk['chunk_id'],
            'text': chunk['text'],
            'embedding': emb.tolist()
        }
        for chunk, emb in zip(chunks, embeddings)
    ]
