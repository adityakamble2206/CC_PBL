import os
import json

# Local dataset of questions mapped to skills
SKILL_QUESTIONS = {
    "React": [
        {"question": "What is the difference between functional and class components in React?", "category": "Technical", "difficulty": "Medium"},
        {"question": "How do Hooks work in React, and which one is your favorite?", "category": "Technical", "difficulty": "Medium"},
        {"question": "Explain the concept of Virtual DOM.", "category": "Technical", "difficulty": "Hard"}
    ],
    "JavaScript": [
        {"question": "What is a closure in JavaScript?", "category": "Technical", "difficulty": "Hard"},
        {"question": "Explain asynchronous programming and promises.", "category": "Technical", "difficulty": "Medium"},
        {"question": "What is 'hoisting'?", "category": "Technical", "difficulty": "Easy"}
    ],
    "Python": [
        {"question": "What are decorators in Python?", "category": "Technical", "difficulty": "Hard"},
        {"question": "How is memory managed in Python?", "category": "Technical", "difficulty": "Medium"},
        {"question": "Explain the difference between a list and a tuple.", "category": "Technical", "difficulty": "Easy"}
    ],
    "Node.js": [
        {"question": "What is the event loop in Node.js?", "category": "Technical", "difficulty": "Hard"},
        {"question": "How do you handle middleware in Express?", "category": "Technical", "difficulty": "Medium"}
    ],
    "Data Scientist": [
        {"question": "Explain the Bias-Variance tradeoff.", "category": "Technical", "difficulty": "Hard"},
        {"question": "How does TF-IDF help in NLP tasks?", "category": "Technical", "difficulty": "Medium"}
    ],
    "DevOps Engineer": [
        {"question": "What is Infrastructure as Code (IaC)?", "category": "Technical", "difficulty": "Medium"},
        {"question": "How do you optimize a CI/CD pipeline?", "category": "Technical", "difficulty": "Hard"}
    ]
}

def generate_local_questions(detected_skills, predicted_role):
    """
    Generates questions based on the local SKILL_QUESTIONS dictionary.
    """
    all_questions = []
    
    # 1. Skill-based questions
    for skill in detected_skills:
        if skill in SKILL_QUESTIONS:
            all_questions.extend(SKILL_QUESTIONS[skill])
            
    # 2. Role-based questions
    if predicted_role in SKILL_QUESTIONS:
        all_questions.extend(SKILL_QUESTIONS[predicted_role])
        
    # Remove duplicates and limit to top 5
    unique_questions = []
    seen = set()
    for q in all_questions:
        if q['question'] not in seen:
            unique_questions.append(q)
            seen.add(q['question'])
            
    return unique_questions[:5]

def get_improvement_suggestions(predicted_role, missing_skills):
    """
    Generates suggestions based on model gap.
    """
    suggestions = [
        f"Strengthen your expertise in {predicted_role} by adding more hands-on projects.",
        f"Consider obtaining certifications in missing areas like: {', '.join(missing_skills[:3])}."
    ]
    if not missing_skills:
        suggestions.append("Your skill profile looks very strong for this role!")
        
    return suggestions
