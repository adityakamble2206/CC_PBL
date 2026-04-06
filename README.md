# Flask Resume Analyzer - 📋 Project Documentation

## Project Overview
AI-powered Resume Analyzer web application built with Flask and MongoDB Atlas. Features resume analysis, skill gap identification, and interview simulation with AI.

## Tech Stack
- **Backend**: Flask (Python)
- **Database**: MongoDB Atlas (Cloud)
- **Frontend**: HTML5, CSS3, JavaScript
- **Authentication**: bcrypt password hashing
- **Deployment**: Render.com, Gunicorn

## Features
✨ **User Authentication** - Secure login/registration with bcrypt hashing
📄 **Resume Upload** - PDF/DOCX file processing
🤖 **AI Analysis** - Google Generative AI integration
🎯 **Skill Analytics** - Gap analysis and recommendations
🎙️ **Interview Simulator** - Text-to-speech enabled quiz with AI questions
💾 **Data Persistence** - MongoDB Atlas cloud database

## Project Structure
```
FSD/
├── app.py                    # Main Flask application
├── requirements.txt          # Python dependencies
├── Procfile                  # Render deployment config
├── runtime.txt              # Python version specification
├── render.yaml              # Render service config
├── .env.example             # Environment variable template
├── .gitignore               # Git ignore rules
│
├── routes/
│   ├── user_api.py         # User authentication & registration
│   └── api.py              # Analysis endpoints
│
├── templates/              # Jinja2 HTML templates
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── profile.html
│   ├── profile-setup.html
│   └── quiz.html
│
├── static/                 # Static assets
│   ├── css/style.css      # Styling
│   └── js/script.js       # Client-side logic
│
├── ai/                     # AI/ML modules
│   ├── ai_engine.py
│   ├── model.py
│   └── question_generator.py
│
├── utils/                  # Utility functions
│   ├── feature_extractor.py
│   ├── file_handler.py
│   ├── nlp_processor.py
│   └── preprocess.py
│
└── test/                   # Test files
    ├── test_mongo.py
    └── test_user_api.py
```

## Installation & Setup

### Local Development
```bash
# 1. Navigate to project
cd "CC PBL/FSD"

# 2. Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# 5. Run Flask app
python app.py
```

**Access**: http://127.0.0.1:5000

### Production Deployment (Render)
See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed instructions.

**Access**: https://cc-pbl-resume-analyzer.onrender.com (after deployment)

## API Documentation

### Authentication Endpoints
```
POST /api/register
POST /api/login
GET /api/users
```

### Resume Analysis
```
POST /api/upload-resume
POST /api/save-analysis
```

## Environment Variables
```env
MONGO_URI=your_mongodb_atlas_uri
SECRET_KEY=your_secret_key
PORT=5000
PYTHONUNBUFFERED=true  # For Render logging
```

## Recent Updates
- ✅ Fixed folder structure (templates/, static/)
- ✅ Fixed all Flask routing with url_for()
- ✅ Lazy MongoDB connection initialization
- ✅ Fixed JavaScript redirects
- ✅ Production-ready Gunicorn setup
- ✅ MongoDB Atlas integration
- ✅ GitHub integration (auto-deploy ready)

## GitHub Repository
https://github.com/adityakamble2206/CC_PBL

## Key Features Implementation

### Smart Routing
All pages use Flask routes instead of direct HTML files:
- `/` → Login
- `/register` → Registration
- `/dashboard` → Main dashboard
- `/profile` → User profile
- `/profile-setup` → Profile setup wizard
- `/quiz` → Interview simulator

### Database
- MongoDB Atlas cloud database with connection pooling
- Lazy initialization for production efficiency
- Secure credential handling via .env

### Authentication
- bcrypt password hashing with salt
- Session management via localStorage
- Protected routes with login requirement

## Author
**Aditya Kamble**

## License
MIT

---

**Last Updated**: April 6, 2026
