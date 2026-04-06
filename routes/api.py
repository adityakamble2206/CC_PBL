from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import shutil
import os
from main import run_local_analysis

app = FastAPI(title="Local AI Resume Analyzer API")

# Directory to store uploaded resumes temporarily
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
):
    """
    Offline endpoint to upload a resume and get Local ML analysis.
    """
    try:
        # 1. Save file locally
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Run local ML analysis
        results = run_local_analysis(file_path)

        return JSONResponse(content=results)

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Local API Error: {str(e)}"}
        )

@app.get("/")
def read_root():
    return {"message": "Local AI Resume Analyzer API is running (Offline)."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
