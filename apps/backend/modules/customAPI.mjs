import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const API_BASE_URL = "https://finalchatdoc.onrender.com";

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
                const pythonProcess = spawn(pythonCommand, [ttsScript, "-", tempFile]);

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
        try {
            console.log(`Sending STT request to ${API_BASE_URL}/stt`);

            // Create a Blob from the buffer
            const blob = new Blob([audioBuffer], { type: 'audio/wav' });

            const formData = new FormData();
            formData.append("audio", blob, "input.wav");

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(`${API_BASE_URL}/stt`, {
                method: "POST",
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`STT API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error("STT API Error:", error);
            return "I couldn't hear you.";
        }
    },
};

export default customAPI;
