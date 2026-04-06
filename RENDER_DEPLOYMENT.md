# Render Deployment Guide for Flask Resume Analyzer

## Prerequisites
1. GitHub Account (already set up at: https://github.com/adityakamble2206/CC_PBL)
2. Render Account (sign up at: https://render.com)
3. MongoDB Atlas Connection String (MONGO_URI)

## Deployment Steps

### Step 1: Connect GitHub to Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Click "Connect account" to link your GitHub
4. Select repository: `adityakamble2206/CC_PBL`
5. Branch: `main`

### Step 2: Configure Service
- **Name**: `cc-pbl-resume-analyzer` (or your choice)
- **Environment**: Python 3
- **Region**: Choose closest to you
- **Branch**: `main`
- **Build Command**: 
  ```
  pip install --upgrade pip && pip install -r requirements.txt
  ```
- **Start Command**: 
  ```
  gunicorn app:app
  ```

### Step 3: Add Environment Variables
In Render dashboard, add these under "Environment":

```
MONGO_URI=mongodb+srv://adityakamble2206_db_user:Ma4M771xcPDHQRjW@cluster0.22dkyoz.mongodb.net/resume_analyzer_db?retryWrites=true&w=majority&appName=Cluster0

SECRET_KEY=your_secret_key_here

PYTHONUNBUFFERED=true
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install `requirements.txt`
   - Run `gunicorn app:app`
   - Deploy to production

3. Wait 2-5 minutes for deployment to complete
4. Your app will be available at: `https://cc-pbl-resume-analyzer.onrender.com`

## Monitoring

Once deployed, you can:
- View logs: Dashboard → Select Service → Logs
- Monitor status: Dashboard → Select Service → Status
- Restart service: Dashboard → Select Service → Manual Deploy

## Important Notes

✅ **Auto-Deploy**: Connected to main branch - changes pushed to GitHub will auto-deploy
✅ **Free Tier**: Render free tier may put service to sleep after 15 min inactivity (spins up on request)
✅ **Production Ready**: Using Gunicorn as production WSGI server
✅ **MongoDB Atlas**: Your MongoDB Atlas connection is cloud-hosted and always accessible

## Troubleshooting

If deployment fails:
1. Check build logs in Render dashboard
2. Verify all environment variables are set
3. Check `requirements.txt` has all dependencies
4. Ensure `.env` is in `.gitignore` (secrets not committed)

## Next Steps After Deployment

1. Test the deployed app at: `https://cc-pbl-resume-analyzer.onrender.com`
2. Routes available:
   - `/` - Login
   - `/register` - Create account
   - `/dashboard` - Main dashboard
   - `/profile` - User profile
   - `/quiz` - Interview simulator
   - `/api/register` - API endpoint
   - `/api/login` - API endpoint

3. Share your deployed app with others!
