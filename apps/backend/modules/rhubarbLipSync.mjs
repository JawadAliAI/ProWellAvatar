import { execCommand } from "../utils/files.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPhonemes = async ({ message, messageText = "Hello" }) => {
    try {
        const time = new Date().getTime();
        console.log(`Starting lip sync for message ${message}`);

        const audiosDir = path.join(__dirname, "..", "audios");
        const wavFile = path.join(audiosDir, `message_${message}.wav`);
        const mp3File = path.join(audiosDir, `message_${message}.mp3`);
        const jsonFile = path.join(audiosDir, `message_${message}.json`);

        // Check if WAV exists, if not convert MP3 to WAV
        if (!fs.existsSync(wavFile)) {
            console.log(`Converting MP3 to WAV for message ${message}...`);
            await execCommand(
                { command: `ffmpeg -y -i "${mp3File}" "${wavFile}"` }
            );
        } else {
            console.log(`WAV file already exists, skipping conversion.`);
        }

        console.log(`Conversion done in ${new Date().getTime() - time}ms`);

        // Resolve path to Rhubarb executable
        // Structure: root/apps/backend/modules/rhubarbLipSync.mjs
        // Rhubarb is at: root/Rhubarb-Lip-Sync-1.14.0-Windows/rhubarb.exe
        const rhubarbPath = path.resolve(__dirname, "../../../Rhubarb-Lip-Sync-1.14.0-Windows/rhubarb.exe");

        console.log(`Looking for Rhubarb at: ${rhubarbPath}`);

        if (!fs.existsSync(rhubarbPath)) {
            throw new Error(`Rhubarb executable not found at ${rhubarbPath}`);
        }

        try {
            // Try to run Rhubarb
            await execCommand({
                command: `"${rhubarbPath}" -f json -o "${jsonFile}" "${wavFile}" -r phonetic`,
            });
            console.log(`✅ Rhubarb lip sync done in ${new Date().getTime() - time}ms`);
        } catch (error) {
            console.warn("⚠️ Rhubarb not found. Using phonetic lip sync fallback...");

            // Import the phonetic lip sync generator
            const { generatePhoneticLipSyncFile } = await import("./phoneticLipSync.mjs");

            // Get the audio duration using ffprobe
            let audioDuration = 1.0;
            try {
                const ffprobeResult = await execCommand({
                    command: `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavFile}"`
                });
                audioDuration = parseFloat(ffprobeResult.stdout.trim());
                console.log(`📏 Audio duration: ${audioDuration}s`);
            } catch (e) {
                console.warn("⚠️ Could not get audio duration, estimating from text");
                // Rough estimate: ~0.15 seconds per character
                audioDuration = messageText.length * 0.15;
            }

            // Generate phonetic lip sync based on text
            generatePhoneticLipSyncFile({
                text: messageText,
                duration: audioDuration,
                outputPath: jsonFile
            });

            console.log(`✅ Phonetic lip sync generated in ${new Date().getTime() - time}ms`);
        }
    } catch (error) {
        console.error(`❌ Error generating phonemes for message ${message}:`, error);
    }
};

export { getPhonemes };
