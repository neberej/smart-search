from backend.config import load_config
from backend.file_loader import load_files
from backend.summarizer import summarize_documents
from backend.embedder import embed_documents
from backend.storage import save_index

def run_indexing():
    config = load_config()
    raw_docs = load_files(config)

    print(f"Loaded {len(raw_docs)} files for indexing.")
    
    summaries = []
    for i, doc in enumerate(raw_docs, start=1):
        print(f"Summarizing file {i}/{len(raw_docs)}: {doc['filename']}")
        summaries.extend(summarize_documents([doc], config))  # Use list to keep summarize_documents unchanged

    print("Embedding documents...")
    embeddings = embed_documents(summaries, config)

    print("Saving index...")
    save_index(summaries, embeddings, config)

    print("Indexing complete.")
