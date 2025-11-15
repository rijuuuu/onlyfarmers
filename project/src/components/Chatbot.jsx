import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom"; // ADDED
import "../style/Chatbot.css";

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const msgsRef = useRef(null);

  // Get current location object
  const location = useLocation(); // ADDED

  // Default collapsed on mobile
  useEffect(() => {
    if (window.innerWidth <= 900) setIsOpen(false);
  }, []);

  // FIXED: Collapse on navigation, but open specifically on the Home page.
  useEffect(() => {
    // Check if the current path is the homepage (either "/" or "/home")
    if (location.pathname === "/" || location.pathname === "/home") {
      // Open the chatbot on the homepage
      setIsOpen(true);
    } else {
      // Close the chatbot on all other pages
      setIsOpen(false);
    }
  }, [location.pathname]); // Triggered when the route path changes

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