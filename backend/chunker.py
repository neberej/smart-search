import re

def chunk_documents(documents, config):
    chunk_size = config.get("chunk_size", 500)
    chunk_overlap = config.get("chunk_overlap", 50)
    all_chunks = []

    for doc in documents:
        text = doc['text']
        paragraphs = re.split(r'\n\s*\n', text.strip())
        chunks = []
        for p in paragraphs:
            p = p.strip()
            if len(p) > 50:
                chunks.append(p)
        for i, chunk in enumerate(chunks):
            all_chunks.append({
                "filename": doc["filename"],
                "chunk_id": i,
                "text": chunk
            })
    return all_chunks
