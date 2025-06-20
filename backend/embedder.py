from sentence_transformers import SentenceTransformer

def embed_documents(docs, config):
    model = SentenceTransformer(config['embedding_model'])
    texts = [doc['summary'] for doc in docs]
    embeddings = model.encode(texts, convert_to_tensor=False)
    return [{'filename': doc['filename'], 'embedding': emb.tolist()} for doc, emb in zip(docs, embeddings)]