from backend.config import load_config
from backend.file_loader import load_files
from backend.chunker import chunk_documents
from backend.embedder import embed_documents
from backend.storage import save_index
from backend.logger import get_logger
logger = get_logger()

def run_indexing():
    config = load_config()
    logger.info("Indexing started")
    raw_docs = load_files(config)
    if not raw_docs:
        logger.info("No files to index.")
        return 0

    chunks = chunk_documents(raw_docs, config)
    print(f"Indexing {len(chunks)} chunks...")
    embeddings = embed_documents(chunks, config)
    save_index(embeddings, config)
    logger.info("Indexing complete")
    return len(raw_docs)