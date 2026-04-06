import os
import json
from utils.file_handler import get_text_from_file
from utils.preprocess import clean_text
from utils.feature_extractor import load_vectorizer, transform_text
from ai.model import load_model
from utils.nlp_processor import extract_name, extract_email, extract_skills_advanced
from ai.question_generator import generate_local_questions, get_improvement_suggestions
from utils.utils import logger, load_json_file

# Paths
MODEL_PATH = "models/classifier.pkl"
VECTORIZER_PATH = "models/vectorizer.pkl"
ROLE_SKILLS_PATH = "data/role_skills.json"

def run_local_analysis(file_path):
    """
    Offline Orchestration:
    File -> Text -> Preprocess -> Feature Extract -> ML Predict -> Local Questions
    """
    # 1. Load Model & Vectorizer
    model = load_model(MODEL_PATH)
    vectorizer = load_vectorizer(VECTORIZER_PATH)
    
    if not model or not vectorizer:
        return {"error": "Local ML models NOT found. Please run training first."}

    # 2. Extract & Preprocess
    text = get_text_from_file(file_path)
    if not text: return {"error": "Extraction failed"}
    
    cleaned = clean_text(text)
    
    # 3. Predict Role
    features = transform_text(cleaned, vectorizer)
    predicted_role = model.predict(features)[0]
    
    # 4. Extract Skills (Local Logic)
    role_data = load_json_file(ROLE_SKILLS_PATH)
    all_possible_skills = []
    for s_list in role_data.values(): all_possible_skills.extend(s_list)
    detected_skills = extract_skills_advanced(text, list(set(all_possible_skills)))
    
    # 5. Gap Analysis
    target_skills = role_data.get(predicted_role, [])
    missing_skills = [s for s in target_skills if s not in detected_skills]
    
    # 6. Local Score (Basic Keyword Density)
    score = min(100, (len(detected_skills) / max(1, len(target_skills))) * 100)
    
    # 7. Local Questions & Suggestions
    questions = generate_local_questions(detected_skills, predicted_role)
    suggestions = get_improvement_suggestions(predicted_role, missing_skills)

    return {
        "status": "success",
        "predicted_role": predicted_role,
        "candidate_info": {
            "name": extract_name(text),
            "email": extract_email(text),
            "skills": detected_skills
        },
        "resume_score": f"{int(score)}/100",
        "missing_skills": missing_skills,
        "suggestions": suggestions,
        "questions": questions
    }

if __name__ == "__main__":
    # Test on the sample file
    test_file = "sample_resume.txt"
    if not os.path.exists(test_file):
        with open(test_file, 'w') as f:
            f.write("Aditya Kamble\naditya@example.com\nFrontend Developer with React and CSS skills.")
            
    res = run_local_analysis(test_file)
    print(json.dumps(res, indent=2))
