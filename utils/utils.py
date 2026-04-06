import logging
import json
import os
from functools import lru_cache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend/app.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("ResumeAnalyzer")

def load_json_file(file_path):
    """Safely loads a JSON file."""
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading JSON {file_path}: {e}")
        return {}

@lru_cache(maxsize=100)
def get_cached_analysis(text_hash):
    """
    Placeholder for a real cache implementation (e.g. Redis).
    Current: Simple in-memory LRU cache.
    """
    return None # In a real system, you'd check a DB or file cache here
