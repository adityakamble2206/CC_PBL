import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

# Setup NLTK
try:
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('punkt', quiet=True)
except Exception as e:
    print(f"NLTK Download error: {e}")

stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

def clean_text(text):
    """
    Cleans text for ML processing:
    1. Lowercasing
    2. Removing special characters
    3. Tokenization
    4. Stopword removal
    5. Lemmatization
    """
    if not text: return ""
    
    # 1. Lowercase and remove special chars
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    
    # 2. Tokenize
    tokens = word_tokenize(text)
    
    # 3. Stopword removal and Lemmatization
    cleaned_tokens = [
        lemmatizer.lemmatize(word) for word in tokens 
        if word not in stop_words and len(word) > 2
    ]
    
    return " ".join(cleaned_tokens)

if __name__ == "__main__":
    sample = "Aditya is a professional Frontend Developer with React and CSS skills."
    print(f"Cleaned: {clean_text(sample)}")
