from sklearn.feature_extraction.text import TfidfVectorizer
import pickle
import os

def create_vectorizer(corpus, save_path="backend/models/vectorizer.pkl"):
    """
    Trains a TF-IDF vectorizer and saves it.
    """
    # Ensure models dir exists
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    vectorizer = TfidfVectorizer(max_features=1000, ngram_range=(1, 2))
    vectorizer.fit(corpus)
    
    with open(save_path, 'wb') as f:
        pickle.dump(vectorizer, f)
    
    return vectorizer

def load_vectorizer(path="backend/models/vectorizer.pkl"):
    """Loads a saved vectorizer."""
    if not os.path.exists(path): return None
    with open(path, 'rb') as f:
        return pickle.load(f)

def transform_text(text, vectorizer):
    """Converts text into TF-IDF vector."""
    return vectorizer.transform([text])
