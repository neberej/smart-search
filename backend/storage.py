import json
from pathlib import Path

def save_index(embeddings, config):
    Path(config['index_folder']).mkdir(parents=True, exist_ok=True)
    with open(Path(config['index_folder']) / 'embeddings.json', 'w') as f:
        json.dump(embeddings, f, indent=2)
