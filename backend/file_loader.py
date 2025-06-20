from pathlib import Path
from backend.parsers import get_parser

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
                    print(f"✓ Indexed: {file_path}")
                    documents.append({
                        'filename': str(file_path),
                        'text': text
                    })
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

    return documents