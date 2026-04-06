import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.tag import pos_tag
from nltk.chunk import ne_chunk
import re

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    nltk.download('maxent_ne_chunker', quiet=True)
    nltk.download('words', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('maxent_ne_chunker_tab', quiet=True)
    nltk.download('averaged_perceptron_tagger_eng', quiet=True)
except Exception as e:
    print(f"Error downloading NLTK data: {e}")

def extract_entities(text):
    """
    Uses NLTK for Named Entity Recognition to extract Organizations, Persons, and Locations.
    """
    entities = {
        "organizations": [],
        "dates": [],
        "locations": []
    }
    
    # Tokenize and Tag
    for sent in sent_tokenize(text):
        for chunk in ne_chunk(pos_tag(word_tokenize(sent))):
            if hasattr(chunk, 'label'):
                name = ' '.join(c[0] for c in chunk)
                if chunk.label() == 'ORGANIZATION':
                    entities["organizations"].append(name)
                elif chunk.label() == 'GPE' or chunk.label() == 'LOCATION':
                    entities["locations"].append(name)
    
    # Date extraction (Regex based for reliability)
    date_pattern = r'\b(19|20)\d{2}\b'
    entities["dates"] = list(set(re.findall(date_pattern, text)))
    
    # Deduplicate
    for key in entities:
        entities[key] = list(set(entities[key]))
    return entities

def extract_name(text):
    """NLTK-based name extraction for the first part of the resume."""
    first_lines = text[:500]
    for sent in sent_tokenize(first_lines):
        for chunk in ne_chunk(pos_tag(word_tokenize(sent))):
            if hasattr(chunk, 'label') and chunk.label() == 'PERSON':
                return ' '.join(c[0] for c in chunk)
    return "Unknown"

def extract_email(text):
    """Standard regex for email."""
    pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    match = re.search(pattern, text)
    return match.group(0) if match else "N/A"

def extract_skills_advanced(text, skill_list):
    """
    NLTK-based tokenization for accurate skill matching.
    """
    tokens = set(word_tokenize(text.lower()))
    skills_found = []
    for skill in skill_list:
        if skill.lower() in tokens:
            skills_found.append(skill)
    return list(set(skills_found))

def preprocess_text(text):
    """Normalize text for processing."""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
