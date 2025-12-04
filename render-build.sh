#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing Node dependencies..."
npm install

echo "Installing Python dependencies..."
# Ensure pip is available and install edge-tts
if command -v pip3 &> /dev/null; then
    pip3 install -r apps/backend/requirements.txt
elif command -v pip &> /dev/null; then
    pip install -r apps/backend/requirements.txt
else
    echo "Error: pip not found. Cannot install Python dependencies."
    exit 1
fi

echo "Installing Rhubarb Lip Sync (Linux)..."
mkdir -p bin
curl -L -o rhubarb-linux.zip https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip
unzip -o rhubarb-linux.zip -d bin
mv bin/Rhubarb-Lip-Sync-1.13.0-Linux bin/rhubarb-lip-sync
chmod +x bin/rhubarb-lip-sync/rhubarb
rm rhubarb-linux.zip

echo "Installing FFmpeg (Linux Static)..."
curl -L -o ffmpeg-release-amd64-static.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xvf ffmpeg-release-amd64-static.tar.xz -C bin
# Move the binary to bin root for easier access
find bin -name "ffmpeg" -type f -exec mv {} bin/ffmpeg \;
find bin -name "ffprobe" -type f -exec mv {} bin/ffprobe \;
chmod +x bin/ffmpeg
chmod +x bin/ffprobe
rm ffmpeg-release-amd64-static.tar.xz
