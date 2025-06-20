from pydantic import BaseModel, ValidationError
import json

class ConfigModel(BaseModel):
    source_folder: str
    index_folder: str
    supported_extensions: list
    chunk_size: int
    chunk_overlap: int
    embedding_model: str
    min_score: float

def load_config(path="config.json"):
    with open(path) as f:
        data = json.load(f)
    return ConfigModel(**data).dict()
