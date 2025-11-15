import React, { useEffect, useRef, useState } from "react";
import "../style/Chatbot.css";

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const msgsRef = useRef(null);

  // Default collapsed on mobile
  useEffect(() => {
    if (window.innerWidth <= 900) setIsOpen(false);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [chatHistory, error]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setChatHistory((prev) => [...prev, { sender: "user", text: message }]);
    const userMessage = message;
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://192.168.0.104:5000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (res.ok) {
        setChatHistory((prev) => [...prev, { sender: "bot", text: data.reply }]);
      } else {
        setError(data.error || "Server Unreachable");
      }
    } catch {
      setError("Server Unreachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating chat icon */}
      {!isOpen && (
        <button
          className="chatbot-icon"
          onClick={() => setIsOpen(true)}
          aria-label="open"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="chatbot">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-title">KrishiMitra Chatbot</div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="msgs" ref={msgsRef}>
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`chat-bubble ${
                  msg.sender === "user" ? "user-bubble" : "bot-bubble"
                }`}
              >
                <div className="bubble-text">{msg.text}</div>
              </div>
            ))}

            {/* Centered red error */}
            {error && <p className="error-msg">{error}</p>}
          </div>

          {/* Input box */}
          <div className="msg-box">
            <form onSubmit={handleSend}>
              <input
                type="text"
                className="chat-input"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
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
