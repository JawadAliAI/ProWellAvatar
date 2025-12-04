# Talking Avatar with AI - Deployment Guide

## 🚀 Deployment Options

This project is configured to deploy the **Backend** on Render. The Frontend should be deployed separately (e.g., on Vercel) or run locally.

### Option 1: Render (Backend Only)

Render is a unified cloud to build and run all your apps and websites.

1.  **Create Render Account**
    - Go to https://render.com
    - Sign up with GitHub

2.  **Create New Web Service**
    - Click "New +" -> "Web Service"
    - Connect your GitHub repository
    - Render should automatically detect the `render.yaml` file.
    - If not detected, choose **Node** as the runtime.

3.  **Configuration (if manual)**
    - **Name**: `healbot-avatar-backend`
    - **Runtime**: Node
    - **Build Command**: `bash ./render-build.sh`
    - **Start Command**: `node apps/backend/server.js`
    - **Environment Variables**:
        - `PYTHON_VERSION`: `3.10.0` (Ensures Python is available)

### Option 2: Render (Frontend - Static Site)

You can also deploy the frontend on Render as a separate Static Site.

1.  **Create New Static Site**
    - Click "New +" -> "Static Site"
    - Connect your GitHub repository
    - Render should automatically detect the configuration from `render.yaml` if you use Blueprints.

2.  **Configuration (if manual)**
    - **Name**: `healbot-avatar-frontend`
    - **Build Command**: `npm install && npm run build --prefix apps/frontend`
    - **Publish Directory**: `apps/frontend/dist`
    - **Environment Variables**:
        - `VITE_API_URL`: The URL of your deployed backend (e.g., `https://healbot-avatar-backend.onrender.com`)

## 📋 Pre-Deployment Checklist

- ✅ Configured Backend for Render Native Node Environment
- ✅ Configured Frontend for Render Static Site
- ✅ Added `render-build.sh` for Backend dependencies
- ✅ CORS enabled for external frontend access

## 🔧 Environment Variables

**Backend:**
- `PORT`: Defaults to `3000`.
- `PYTHON_VERSION`: `3.10.0`

**Frontend:**
- `VITE_API_URL`: URL of the backend service.

## 🔧 Environment Variables

**Render:**
- `PORT`: Defaults to `3000`. Render sets this automatically.
- `PYTHON_VERSION`: `3.10.0` (Required to make Python available in Node environment)

## 🔧 Environment Variables

**Render:**
- `PORT`: Defaults to `3000`. Render sets this automatically.

## 🧪 Testing After Deployment

1.  Open your frontend URL: `https://prowellavatarfront.onrender.com`
2.  The frontend should load and connect to the backend at `https://prowellavatarback.onrender.com`.
3.  Send a message. The backend should process it using `edge-tts` and local `vosk` STT.

## 🆘 Troubleshooting

- **Build Fails**: Check the logs. Ensure `render-build.sh` is running correctly.
- **Audio Issues**: If TTS fails, check if `edge-tts` is working.
- **Microphone Issues**: Ensure you have allowed microphone access in the browser.
