import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "../style/Chatbot.css";

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(true);
  const [userClosed, setUserClosed] = useState(false); // FIX
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const msgsRef = useRef(null);
  const location = useLocation();

  const detectMobile = () => {
    return (
      window.innerWidth <= 1024 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  };

  const adjustChatState = () => {
    if (userClosed) return; // ⬅ prevents forced reopening

    if (detectMobile()) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    adjustChatState();
    window.addEventListener("resize", adjustChatState);
    return () => window.removeEventListener("resize", adjustChatState);
  }, [userClosed]);

  useEffect(() => {
    adjustChatState();
  }, [location.pathname]);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [chatHistory, error]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const text = message;

    setChatHistory((prev) => [...prev, { sender: "user", text }]);
    setMessage("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://192.168.1.5:5000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (res.ok) {
        setChatHistory((prev) => [
          ...prev,
          { sender: "bot", text: data.reply },
        ]);
      } else {
        setError(data.error || "Server error");
      }
    } catch {
      setError("Server Unreachable");
    }

    setLoading(false);
  };

  const closeChat = () => {
    setIsOpen(false);
    setUserClosed(true); // FIX — prevents reopening
  };

  const openChat = () => {
    setIsOpen(true);
    setUserClosed(false); // FIX — allows auto behavior again
  };

  return (
    <>
      {!isOpen && (
        <button className="chatbot-icon" onClick={openChat}>
          💬
        </button>
      )}

      {isOpen && (
        <div className="chatbot">
          <div className="chat-header">
            <div className="chat-title">KrishiMitra Chatbot</div>
            <button className="close-btn" onClick={closeChat}>
              ✕
            </button>
          </div>

          <div className="msgs" ref={msgsRef}>
            {chatHistory.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.sender}-bubble`}>
                {m.text}
              </div>
            ))}

            {error && <p className="error-msg">{error}</p>}
          </div>

          {/* Restore your FULL styled send button */}
          <div className="msg-box">
            <form onSubmit={handleSend}>
              <input
                type="text"
                className="chat-input"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button type="submit" disabled={loading}>
                {loading ? "..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
