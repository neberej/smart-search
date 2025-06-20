import json

def parse(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return json.dumps(data, indent=2)