import { useRef } from "react";
import { useSpeech } from "../hooks/useSpeech";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const ChatInterface = ({ hidden, ...props }) => {
  const input = useRef();
  const { tts, loading, message, startRecording, stopRecording, recording } = useSpeech();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const sendMessage = () => {
    const text = input.current.value;
    const userId = currentUser ? currentUser.uid : "demo_user_123";

    if (!loading && !message) {
      tts(text, userId);
      input.current.value = "";
    }
  };

  if (hidden) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
      <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg flex justify-between items-center w-full max-w-md pointer-events-auto">
        <div>
          <h1 className="font-black text-xl text-gray-700">
            {currentUser?.displayName ? `Hello, ${currentUser.displayName} 👋` : "Dr. HealBot 🩺"}
          </h1>
          <p className="text-gray-600 text-sm">
            {loading ? "Thinking..." : "Your AI Medical Assistant"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="w-full flex flex-col items-end justify-center gap-4"></div>
      <div className="flex flex-col items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`bg-gray-500 hover:bg-gray-600 text-white p-4 px-4 font-semibold uppercase rounded-md ${recording ? "bg-red-500 hover:bg-red-600" : ""
              } ${loading || message ? "cursor-not-allowed opacity-30" : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
              />
            </svg>
          </button>

          <input
            className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
            placeholder="Type a message..."
            ref={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />
          <button
            disabled={loading || message}
            onClick={sendMessage}
            className={`bg-gray-500 hover:bg-gray-600 text-white p-4 px-10 font-semibold uppercase rounded-md ${loading || message ? "cursor-not-allowed opacity-30" : ""
              }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
