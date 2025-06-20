from pathlib import Path
from backend.parsers import get_parser
import os
from datetime import datetime

def load_files(config):
    folder = Path(config['source_folder'])
    extensions = config['supported_extensions']
    documents = []

    for file_path in folder.rglob('*'):
        ext = file_path.suffix.lower()
        if ext in extensions:
            parser = get_parser(ext)
            if not parser:
                print(f"No parser for {ext}")
                continue
            try:
                print(f"Indexing {file_path}")
                text = parser.parse(file_path)
                if text.strip():
                    print(f"Indexed: {file_path}")
                    stat = file_path.stat()
                    documents.append({
                        'filename': str(file_path),
                        'text': text,
                        'size_bytes': stat.st_size,
                        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        'type': file_path.suffix.lower().lstrip(".")
                    })
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

    return documents