from flask import Blueprint, request, jsonify
from pymongo import MongoClient
import bcrypt
import re
import datetime
import os
from werkzeug.utils import secure_filename
from utils.file_handler import get_text_from_file

user_api_bp = Blueprint('user_api', __name__)

# Configuration - Lazy MongoDB connection
# This avoids connection issues at startup and improves resilience
MONGO_URI = os.getenv("MONGO_URI")
_mongo_client = None
_db = None
_users_col = None
_resumes_col = None

def get_db_client():
    """Lazy initialization of MongoDB client with connection pooling"""
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            maxPoolSize=10,
            retryWrites=True
        )
    return _mongo_client

def get_db():
    """Get database instance"""
    global _db
    if _db is None:
        _db = get_db_client()['userDB']
    return _db

def get_users_col():
    """Get users collection"""
    global _users_col
    if _users_col is None:
        _users_col = get_db()['users']
    return _users_col

def get_resumes_col():
    """Get resumes collection"""
    global _resumes_col
    if _resumes_col is None:
        _resumes_col = get_db()['resumes']
    return _resumes_col

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

@user_api_bp.route('/upload-resume', methods=['POST'])
def upload_resume():
    # ... existing upload_resume logic ...
    # (Abbreviated for brevity in this thought, but I will provide full code in tool call)
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        email = request.form.get('email', 'anonymous')

        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if file:
            filename = secure_filename(file.filename)
            # Standardize upload directory relative to project root
            base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
            upload_dir = os.path.join(base_dir, 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)

            extracted_text = get_text_from_file(file_path)

            resume_data = {
                "email": email,
                "file_name": filename,
                "file_path": file_path,
                "extracted_text": extracted_text,
                "upload_date": datetime.datetime.utcnow()
            }
            get_resumes_col().insert_one(resume_data)

            return jsonify({
                "message": "Resume uploaded and text extracted!",
                "file_name": filename,
                "extracted_text": extracted_text
            }), 200

    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@user_api_bp.route('/save-analysis', methods=['POST'])
def save_analysis():
    # ... existing save_analysis logic ...
    try:
        data = request.json
        email = data.get('email', 'anonymous')
        role = data.get('role')
        results = data.get('results')

        if not results:
            return jsonify({"error": "No results provided"}), 400

        get_resumes_col().update_one(
            {"email": email},
            {"$set": {
                "role": role,
                "analysis_results": results,
                "last_analyzed": datetime.datetime.utcnow()
            }},
            sort=[("upload_date", -1)]
        )
        return jsonify({"message": "Analysis results saved successfully!"}), 200
    except Exception as e:
        return jsonify({"error": f"Save failed: {str(e)}"}), 500

@user_api_bp.route('/register', methods=['POST'])
def register():
    # ... existing register logic ...
    try:
        data = request.json
        name = data.get('name'); email = data.get('email'); password = data.get('password')
        if not name or not email or not password:
            return jsonify({"error": "All fields required"}), 400
        if not re.match(EMAIL_REGEX, email):
            return jsonify({"error": "Invalid email format"}), 400
        if len(password) < 6:
            return jsonify({"error": "Password too short"}), 400
        if get_users_col().find_one({"email": email}):
            return jsonify({"error": "User exists"}), 400

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        get_users_col().insert_one({"name": name, "email": email, "password": hashed_password, "createdAt": datetime.datetime.utcnow()})
        return jsonify({"message": "User registered successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_api_bp.route('/login', methods=['POST'])
def login():
    # ... existing login logic ...
    try:
        data = request.json
        email = data.get('email'); password = data.get('password')
        user = get_users_col().find_one({"email": email})
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            return jsonify({"message": "Login successful!", "user": {"name": user['name'], "email": user['email']}}), 200
        return jsonify({"error": "Invalid email or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_api_bp.route('/users', methods=['GET'])
def get_users():
    try:
        users = list(get_users_col().find({}, {"password": 0, "_id": 0}))
        for user in users:
            if isinstance(user.get('createdAt'), datetime.datetime):
                user['createdAt'] = user['createdAt'].isoformat()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
