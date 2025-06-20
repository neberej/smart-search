import json
from pathlib import Path

def save_index(summaries, embeddings, config):
    Path(config['index_folder']).mkdir(parents=True, exist_ok=True)
    with open(Path(config['index_folder']) / 'summaries.json', 'w') as f:
        json.dump(summaries, f, indent=2)
    with open(Path(config['index_folder']) / 'embeddings.json', 'w') as f:
        json.dump(embeddings, f, indent=2)