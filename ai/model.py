import pandas as pd
from sklearn.linear_model import LogisticRegression
import pickle
import os
from utils.utils import logger
from utils.preprocess import clean_text
from utils.feature_extractor import create_vectorizer

def train_and_save_model(data_path="data/resume_dataset.csv", model_path="models/classifier.pkl"):
    """
    Trains a Logistic Regression model on the resume dataset.
    """
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}")
        return
        
    # 1. Load Data
    df = pd.read_csv(data_path)
    
    # 2. Preprocess Text
    print("Preprocessing training data...")
    df['Clean_Text'] = df['Text'].apply(clean_text)
    
    # 3. Vectorize
    print("Extracting features (TF-IDF)...")
    vectorizer = create_vectorizer(df['Clean_Text'])
    X = vectorizer.transform(df['Clean_Text'])
    y = df['Role']
    
    # 4. Train Model
    print("Training Logistic Regression model...")
    model = LogisticRegression(max_iter=500)
    model.fit(X, y)
    
    # 5. Save Model
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"Model saved to {model_path}")
    return model

def load_model(path="models/classifier.pkl"):
    """Loads a saved model."""
    if not os.path.exists(path): return None
    with open(path, 'rb') as f:
        return pickle.load(f)

if __name__ == "__main__":
    train_and_save_model()
