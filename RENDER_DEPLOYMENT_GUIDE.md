# 🚀 Render Deployment Guide - ProWell Avatar

This guide will walk you through deploying your Talking Avatar application to Render using the Blueprint feature.

## 📋 Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Git** - Ensure your code is committed and pushed to GitHub

## 🔧 Pre-Deployment Setup

### 1. Ensure Your Code is on GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Ready for Render deployment"

# Add your GitHub repository as remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/ProWellAvatar.git

# Push to GitHub
git push -u origin main
```

### 2. Verify Configuration Files

Make sure these files exist in your repository root:
- ✅ `render.yaml` - Blueprint configuration
- ✅ `render-build.sh` - Build script for backend
- ✅ `apps/backend/requirements.txt` - Python dependencies
- ✅ `.gitignore` - Excludes sensitive files

## 🌐 Deploy to Render

### Option 1: Using Render Blueprint (Recommended - Deploys Both Services)

1. **Go to Render Dashboard**
   - Navigate to [dashboard.render.com](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**

2. **Connect Your Repository**
   - Select **"Connect a repository"**
   - Authorize Render to access your GitHub account
   - Select your `ProWellAvatar` repository

3. **Configure Blueprint**
   - Render will automatically detect `render.yaml`
   - Review the services:
     - **prowellavatarback** (Web Service - Backend)
     - **prowellavatarfront** (Static Site - Frontend)
   - Click **"Apply"**

4. **Wait for Deployment**
   - Backend will build first (takes 5-10 minutes)
   - Frontend will build after backend is ready
   - Monitor the logs for any errors

5. **Get Your URLs**
   - Backend: `https://prowellavatarback.onrender.com`
   - Frontend: `https://prowellavatarfront.onrender.com`

### Option 2: Manual Deployment (Deploy Services Separately)

#### A. Deploy Backend First

1. **Create Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   
2. **Configure Backend Service**
   - **Name**: `prowellavatarback`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `bash ./render-build.sh`
   - **Start Command**: `node apps/backend/server.js`
   - **Instance Type**: `Free`

3. **Add Environment Variables**
   - `PORT`: `3000` (auto-set by Render)
   - `PYTHON_VERSION`: `3.10.0`

4. **Deploy**
   - Click **"Create Web Service"**
   - Wait for build to complete (5-10 minutes)
   - Copy the service URL (e.g., `https://prowellavatarback.onrender.com`)

#### B. Deploy Frontend

1. **Create Static Site**
   - Click **"New +"** → **"Static Site"**
   - Connect your GitHub repository

2. **Configure Frontend Service**
   - **Name**: `prowellavatarfront`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build --prefix apps/frontend`
   - **Publish Directory**: `apps/frontend/dist`

3. **Add Environment Variables**
   - **Key**: `VITE_API_URL`
   - **Value**: Your backend URL (e.g., `https://prowellavatarback.onrender.com`)

4. **Deploy**
   - Click **"Create Static Site"**
   - Wait for build to complete (2-5 minutes)

## 🔍 Verify Deployment

### 1. Check Backend Health

Open in browser:
```
https://prowellavatarback.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T17:30:00.000Z"
}
```

### 2. Test Frontend

1. Open your frontend URL: `https://prowellavatarfront.onrender.com`
2. You should see the login page
3. Sign up or log in
4. Try sending a message to the avatar
5. Verify:
   - ✅ Avatar loads and renders
   - ✅ Text messages work
   - ✅ Voice input works (microphone permission)
   - ✅ Avatar speaks with lip sync

## ⚠️ Important Notes

### Free Tier Limitations

- **Backend**: Spins down after 15 minutes of inactivity
- **First Request**: May take 30-60 seconds to wake up
- **Build Time**: Limited to 10 minutes
- **Bandwidth**: 100GB/month

### Cold Start Issues

When the backend spins down, the first request will be slow:
1. User sends message
2. Backend wakes up (30-60 seconds)
3. Response is generated
4. Subsequent requests are fast

**Solution**: Keep backend alive with a cron job or upgrade to paid tier.

### CORS Configuration

The backend is already configured to accept requests from any origin:
```javascript
app.use(cors());
```

If you need to restrict to specific domains:
```javascript
app.use(cors({
  origin: ['https://prowellavatarfront.onrender.com']
}));
```

## 🐛 Troubleshooting

### Build Fails

**Check Logs:**
1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. Look for error messages

**Common Issues:**
- **Python not found**: Ensure `PYTHON_VERSION=3.10.0` is set
- **npm install fails**: Check `package.json` for syntax errors
- **Rhubarb download fails**: Network timeout, retry deployment

### Frontend Can't Connect to Backend

**Check:**
1. Backend is running (check health endpoint)
2. `VITE_API_URL` is set correctly in frontend environment variables
3. No CORS errors in browser console

**Fix:**
1. Go to frontend service settings
2. Update `VITE_API_URL` environment variable
3. Trigger manual deploy

### Audio/TTS Not Working

**Check:**
1. Backend logs for TTS errors
2. Python dependencies installed correctly
3. `edge-tts` is working

**Test:**
```bash
# SSH into backend (if possible) or check logs
edge-tts --list-voices
```

### Lip Sync Not Working

**Check:**
1. Rhubarb binary is executable
2. FFmpeg is installed
3. Audio files are being generated

**Logs to look for:**
```
Installing Rhubarb Lip Sync (Linux)...
Installing FFmpeg (Linux Static)...
```

## 🔄 Updating Your Deployment

### Auto-Deploy (Recommended)

Render automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature X"
git push origin main
```

Render will automatically:
1. Detect the push
2. Rebuild affected services
3. Deploy new version

### Manual Deploy

1. Go to Render dashboard
2. Select your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

## 📊 Monitoring

### View Logs

1. Go to service in Render dashboard
2. Click **"Logs"** tab
3. Monitor real-time logs

### Metrics

1. Click **"Metrics"** tab
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

## 🎯 Next Steps

1. **Custom Domain** (Paid plans)
   - Add your own domain
   - Configure DNS settings

2. **Environment Secrets**
   - Add API keys securely
   - Use Render's secret management

3. **Database** (if needed)
   - Add PostgreSQL database
   - Connect to backend

4. **Monitoring**
   - Set up health checks
   - Configure alerts

## 📞 Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Community**: [community.render.com](https://community.render.com)
- **Status**: [status.render.com](https://status.render.com)

---

**Deployment Checklist:**
- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Blueprint deployed or services created manually
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Avatar renders and responds
- [ ] Voice input works
- [ ] Lip sync is functional

**🎉 Congratulations! Your Talking Avatar is now live on Render!**
