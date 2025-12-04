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

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Voice input:', transcript);

        // Send the transcribed text to TTS endpoint with current user ID
        await tts(transcript, userIdRef.current);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setRecording(false);
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access.');
        } else {
          alert(`Voice recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Web Speech API not supported in this browser');
    }
  }, []);

  const startRecording = async () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      setRecording(true);
      recognitionRef.current.start();
      console.log('🎤 Listening...');
    } catch (err) {
      console.error('Error starting recognition:', err);
      setRecording(false);
      alert('Failed to start voice recognition. Please try again.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && recording) {
      recognitionRef.current.stop();
      setRecording(false);
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
      alert("Failed to get response. Please try again.");
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
