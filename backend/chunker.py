def chunk_documents(documents, config):
    chunk_size = config.get("chunk_size", 200)  # Smaller chunks
    chunk_overlap = config.get("chunk_overlap", 50)
    all_chunks = []

    for doc in documents:
        text = doc['text']
        # Split into sentences for finer granularity
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        current_chunk = ""
        chunk_id = 0
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            if len(current_chunk) + len(sentence) <= chunk_size:
                current_chunk += " " + sentence
            else:
                if current_chunk:
                    all_chunks.append({
                        "filename": doc["filename"],
                        "chunk_id": chunk_id,
                        "text": current_chunk.strip()
                    })
                    chunk_id += 1
                    # Add overlap
                    overlap_text = current_chunk[-chunk_overlap:] if len(current_chunk) > chunk_overlap else current_chunk
                    current_chunk = overlap_text + " " + sentence
                else:
                    current_chunk = sentence
        if current_chunk:
            all_chunks.append({
                "filename": doc["filename"],
                "chunk_id": chunk_id,
                "text": current_chunk.strip()
            })
    return all_chunks