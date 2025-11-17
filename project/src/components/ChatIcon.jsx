import React from "react";
import "../style/ChatIcon.css";

export default function ChatIcon({ onClick }) {
  return (
    <button className="chat-icon-btn" onClick={onClick} aria-label="Open chat">
      💬
    </button>
  );
}