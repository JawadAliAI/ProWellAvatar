import { createContext, useContext, useEffect, useRef, useState } from "react";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const [recording, setRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const userIdRef = useRef("demo_user_123");

  const setUserId = (id) => {
    userIdRef.current = id;
  };

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1]; // Remove data URL prefix

          setLoading(true);
          try {
            // Send to backend STS endpoint
            const response = await fetch(`${backendUrl}/sts`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                audio: base64Audio,
                userId: userIdRef.current
              }),
            });

            if (!response.ok) {
              throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.error) {
              throw new Error(data.error);
            }

            setMessages((messages) => [...messages, ...data.messages]);
          } catch (error) {
            console.error("STS Error:", error);
            alert(`Error processing speech: ${error.message}`);
          } finally {
            setLoading(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      console.log('🎤 Recording started...');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      console.log('🎤 Recording stopped.');

      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const tts = async (message, userId) => {
    const effectiveUserId = userId || userIdRef.current || "demo_user_123";
    setLoading(true);
    try {
      const data = await fetch(`${backendUrl}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, userId: effectiveUserId }),
      });
      const response = (await data.json()).messages;
      setMessages((messages) => [...messages, ...response]);
    } catch (error) {
      console.error("TTS error:", error);
      alert(`Failed to get response: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <SpeechContext.Provider
      value={{
        startRecording,
        stopRecording,
        recording,
        tts,
        message,
        onMessagePlayed,
        loading,
        setUserId,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return context;
};
