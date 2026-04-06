import os
from dotenv import load_dotenv

# Load environment variables FIRST, before any imports that depend on them
load_dotenv()

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from routes.user_api import user_api_bp

# Use absolute paths for reliability
base_dir = os.path.abspath(os.path.dirname(__file__))
template_dir = os.path.join(base_dir, 'templates')
static_dir = os.path.join(base_dir, 'static')

app = Flask(__name__, 
            static_folder=static_dir, 
            template_folder=template_dir)

app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "your_secret_key_here")
app.config['UPLOAD_FOLDER'] = os.path.join(base_dir, 'uploads')

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

CORS(app)

# Register Blueprints
app.register_blueprint(user_api_bp, url_prefix='/api')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/profile-setup')
def profile_setup():
    return render_template('profile-setup.html')

@app.route('/quiz')
def quiz():
    return render_template('quiz.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    is_production = os.environ.get("RENDER") is not None
    debug_mode = not is_production
    
    print(f"[INFO] Flask server starting on http://0.0.0.0:{port}")
    print(f"[INFO] Environment: {'Production (Render)' if is_production else 'Development'}")
    print(f"[INFO] Debug mode: {debug_mode}")
    
    # Use Gunicorn in production (started by Procfile), 
    # only run development server locally
    if not is_production:
        app.run(debug=debug_mode, host='0.0.0.0', port=port, use_reloader=False)
    else:
        app.run(debug=False, host='0.0.0.0', port=port)
