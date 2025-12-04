import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const API_BASE_URL = "https://prowellchatdoc.onrender.com";

import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const customAPI = {
    chat: async (message, userId) => {
        try {
            const effectiveUserId = userId || "demo_user_123";
            console.log(`Sending Chat request to ${API_BASE_URL}/chat for user: ${effectiveUserId}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: message,
                    user_id: effectiveUserId,
                    language: "en"
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Chat API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();

            // The API returns the message in the 'reply' field
            const botResponse = data.reply || data.response || data.message || "I didn't get a reply.";

            return botResponse;
        } catch (error) {
            console.error("Chat API Error:", error);
            return "I'm having trouble connecting to the doctor right now. Please try again later.";
        }
    },

    tts: async (text) => {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Generating local TTS for text: "${text.substring(0, 20)}..."`);

                const ttsScript = path.join(__dirname, "..", "utils", "tts.py");
                const tempFile = path.join(__dirname, "..", "tmp", `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);

                // Ensure tmp dir exists
                const tmpDir = path.dirname(tempFile);
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                const pythonCommand = process.platform === "win32" ? "python" : "python3";

                // Set PYTHONPATH to include local pylib directory for Render
                const pylibPath = path.join(__dirname, "..", "..", "..", "pylib");
                const env = {
                    ...process.env,
                    PYTHONPATH: process.env.PYTHONPATH ? `${process.env.PYTHONPATH}:${pylibPath}` : pylibPath
                };

                const pythonProcess = spawn(pythonCommand, [ttsScript, "-", tempFile], { env });

                pythonProcess.stdin.write(text);
                pythonProcess.stdin.end();

                let errorOutput = "";

                pythonProcess.stderr.on("data", (data) => {
                    errorOutput += data.toString();
                });

                pythonProcess.on("close", async (code) => {
                    if (code !== 0) {
                        console.error(`TTS Process Error: ${errorOutput}`);
                        // Fallback to silent buffer on error to prevent crash
                        resolve(Buffer.alloc(1024));
                        return;
                    }

                    try {
                        const audioBuffer = await fs.promises.readFile(tempFile);
                        console.log(`TTS generated audio size: ${audioBuffer.length} bytes`);

                        if (audioBuffer.length < 1000) {
                            console.warn("⚠️ Warning: Generated audio is suspiciously small.");
                        }

                        // Clean up
                        fs.unlink(tempFile, (err) => { if (err) console.error("Error deleting temp file:", err); });
                        resolve(audioBuffer);
                    } catch (err) {
                        console.error("Error reading TTS file:", err);
                        resolve(Buffer.alloc(1024));
                    }
                });
            } catch (error) {
                console.error("TTS Wrapper Error:", error);
                resolve(Buffer.alloc(1024));
            }
        });
    },

    stt: async (audioBuffer) => {
        return new Promise((resolve, reject) => {
            try {
                console.log("Processing local STT with Vosk...");

                const sttScript = path.join(__dirname, "..", "utils", "stt.py");
                const modelPath = path.join(__dirname, "..", "models", "vosk-model-small-en-us-0.15");

                const tempInput = path.join(__dirname, "..", "tmp", `stt_in_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);
                const tempOutput = path.join(__dirname, "..", "tmp", `stt_out_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);

                // Ensure tmp dir exists
                const tmpDir = path.dirname(tempInput);
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                // Write input buffer to file
                fs.writeFileSync(tempInput, Buffer.from(audioBuffer));

                // Convert to 16kHz Mono WAV for Vosk using FFmpeg
                // We use the execCommand from files.mjs logic here, but implemented directly for simplicity or import it
                // Let's assume ffmpeg is in PATH (which we ensured in render-build.sh and files.mjs)

                // Construct command to convert audio
                // -ac 1: Mono
                // -ar 16000: 16kHz sample rate
                // -f wav: WAV format
                const ffmpegCommand = `ffmpeg -y -i "${tempInput}" -ac 1 -ar 16000 -f wav "${tempOutput}"`;

                exec(ffmpegCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error("FFmpeg conversion error:", stderr);
                        resolve(""); // Return empty string on error
                        return;
                    }

                    // Run Python Vosk Script
                    const pythonCommand = process.platform === "win32" ? "python" : "python3";
                    const pythonProcess = spawn(pythonCommand, [sttScript, tempOutput, modelPath]);

                    let transcription = "";
                    let errorOutput = "";

                    pythonProcess.stdout.on("data", (data) => {
                        transcription += data.toString();
                    });

                    pythonProcess.stderr.on("data", (data) => {
                        errorOutput += data.toString();
                    });

                    pythonProcess.on("close", (code) => {
                        // Cleanup
                        try {
                            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
                        } catch (e) { console.error("Cleanup error:", e); }

                        if (code !== 0) {
                            console.error(`Vosk STT Error: ${errorOutput}`);
                            resolve("");
                        } else {
                            const text = transcription.trim();
                            console.log(`STT Result: "${text}"`);
                            resolve(text);
                        }
                    });
                });

            } catch (error) {
                console.error("Local STT Error:", error);
                resolve("");
            }
        });
    },
};

export default customAPI;
