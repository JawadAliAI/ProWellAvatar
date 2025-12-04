import customAPI from "./customAPI.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64, execCommand } from "../utils/files.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lipSync = async ({ messages }) => {
    await Promise.all(
        messages.map(async (message, index) => {
            const audiosDir = path.join(__dirname, "..", "audios");
            const fileNameWav = path.join(audiosDir, `message_${index}.wav`);
            const fileNameMp3 = path.join(audiosDir, `message_${index}.mp3`);

            try {
                // 1. Get Audio from Custom TTS (returns ArrayBuffer of MP3)
                console.log(`Generating audio for message ${index}...`);
                const audioBuffer = await customAPI.tts(message.text);

                // Save as MP3 first (since ElevenLabs returns MP3)
                fs.writeFileSync(fileNameMp3, Buffer.from(audioBuffer));
                console.log(`Audio saved to ${fileNameMp3}`);

                // 2. Convert MP3 to WAV for Rhubarb (it needs WAV)
                try {
                    await execCommand({
                        command: `ffmpeg -y -i ${fileNameMp3} ${fileNameWav}`,
                    });
                    console.log(`Converted to ${fileNameWav}`);
                } catch (error) {
                    console.warn(`⚠️ FFmpeg conversion failed: ${error.message}. Proceeding to phonetic fallback...`);
                }

                // 3. Generate Lip Sync (Rhubarb or Phonetic Fallback)
                // getPhonemes will handle missing WAV files by using the phonetic generator
                await getPhonemes({ message: index, messageText: message.text });

                // 4. Read files and attach to message object
                message.audio = await audioFileToBase64({ fileName: fileNameMp3 });
                message.lipsync = await readJsonTranscript({ fileName: path.join(audiosDir, `message_${index}.json`) });

            } catch (error) {
                console.error(`Error processing message ${index}:`, error);
            }
        })
    );

    return messages;
};

export { lipSync };
