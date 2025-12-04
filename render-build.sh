#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "========================================="
echo "Starting Render Build Process"
echo "========================================="

# Print Python version
echo "Python version:"
python3 --version || python --version

# Print pip version
echo "Pip version:"
pip3 --version || pip --version

echo ""
echo "Installing Node dependencies..."
npm install

echo ""
echo "Installing Python dependencies..."
# Install Python packages (without --user flag for Render)
if command -v pip3 &> /dev/null; then
    echo "Using pip3 to install requirements..."
    pip3 install -r apps/backend/requirements.txt
    echo "Verifying gTTS installation..."
    python3 -c "from gtts import gTTS; print('✓ gTTS installed successfully')" || echo "✗ gTTS installation failed"
    python3 -c "import sys; print('Python path:', sys.path)"
elif command -v pip &> /dev/null; then
    echo "Using pip to install requirements..."
    pip install -r apps/backend/requirements.txt
    echo "Verifying gTTS installation..."
    python -c "from gtts import gTTS; print('✓ gTTS installed successfully')" || echo "✗ gTTS installation failed"
    python -c "import sys; print('Python path:', sys.path)"
else
    echo "Error: pip not found. Cannot install Python dependencies."
    exit 1
fi

echo ""
echo "Installing Rhubarb Lip Sync (Linux)..."
mkdir -p bin/rhubarb-lip-sync
curl -L -o rhubarb-linux.zip https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip
unzip -o rhubarb-linux.zip -d bin/temp
mv bin/temp/Rhubarb-Lip-Sync-1.13.0-Linux/* bin/rhubarb-lip-sync/
chmod +x bin/rhubarb-lip-sync/rhubarb
rm -rf bin/temp rhubarb-linux.zip

# Verify Rhubarb installation
if [ -f "bin/rhubarb-lip-sync/rhubarb" ]; then
    echo "✓ Rhubarb installed at: $(pwd)/bin/rhubarb-lip-sync/rhubarb"
    ls -lh bin/rhubarb-lip-sync/rhubarb
else
    echo "✗ Rhubarb installation failed"
    exit 1
fi

echo ""
echo "Installing FFmpeg (Linux Static)..."
mkdir -p bin/ffmpeg-temp
curl -L -o ffmpeg-release-amd64-static.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz -C bin/ffmpeg-temp --strip-components=1
mv bin/ffmpeg-temp/ffmpeg bin/ffmpeg
mv bin/ffmpeg-temp/ffprobe bin/ffprobe
chmod +x bin/ffmpeg bin/ffprobe
rm -rf bin/ffmpeg-temp ffmpeg-release-amd64-static.tar.xz

# Verify FFmpeg installation
if [ -f "bin/ffmpeg" ]; then
    echo "✓ FFmpeg installed at: $(pwd)/bin/ffmpeg"
    bin/ffmpeg -version | head -1
else
    echo "✗ FFmpeg installation failed"
    exit 1
fi

echo ""
echo "========================================="
echo "Build completed successfully!"
echo "========================================="
echo "Installed components:"
echo "  - Node modules"
echo "  - Python packages (edge-tts, vosk)"
echo "  - Rhubarb Lip Sync: bin/rhubarb-lip-sync/rhubarb"
echo "  - FFmpeg: bin/ffmpeg"
echo "========================================="
