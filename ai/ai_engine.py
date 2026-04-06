import google.generativeai as genai
import os
import json
from utils.utils import logger

def analyze_resume_with_ai(resume_text, extracted_info, job_role, api_key=None):
    """
    Sends resume text and extracted entities to Google Gemini.
    Ensures 100% dynamic response based on input.
    """
    # Use provided key or environment variable
    if not api_key:
        api_key = os.getenv("GOOGLE_API_KEY") or "AIzaSyC78tFFbmbflpT3b0k884hH6eg4I51yqJc"

    if not api_key:
        logger.error("Gemini API Key missing.")
        return {"error": "Gemini API Key missing. Cannot perform dynamic AI analysis."}

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash') # Use confirmed working 2.5 flash model

        # Prompt engineering for Gemini: Strict JSON and NO generic advice
        prompt = f"""
        SYSTEM: You are a Senior Technical Recruiter and Career Consultant. 
        Analyze the provided resume text for the role of '{job_role}'.
        
        EXTRACTED ENTITIES (for context):
        {json.dumps(extracted_info, indent=2)}
        
        FULL RESUME TEXT:
        {resume_text}
        
        CONSTRAINTS:
        - Do NOT use generic feedback like 'Add more keywords'.
        - IMPROVEMENTS must be specific, mentioning real projects or skills found in the text.
        - INTERVIEW QUESTIONS must be directly derived from the candidate's specific experience and the '{job_role}' role.
        - Return ONLY a JSON object. No conversational filler or markdown code blocks (unless the whole response is one JSON block).

        REQUIRED JSON STRUCTURE:
        {{
          "resume_analysis": "A detailed 2-3 paragraph professional evaluation.",
          "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
          "missing_skills": ["Skill 1", "Skill 2"],
          "linkedin_summary": "A 3-5 line professional summary.",
          "interview_questions": [
            {{
              "question": "Realistic question based on their project/experience",
              "category": "Technical/Behavioral/HR",
              "difficulty": "Easy/Medium/Hard"
            }}
          ]
        }}
        """

        logger.info(f"Sending request to Gemini for role: {job_role}")
        response = model.generate_content(prompt)
        
        # Clean response text (Gemini sometimes adds markdown code blocks)
        content = response.text.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()

        return json.loads(content)
        
    except Exception as e:
        logger.error(f"Gemini AI Engine Error: {e}")
        return {"error": f"Failed to generate analysis with Gemini: {str(e)}"}
