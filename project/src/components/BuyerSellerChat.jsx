import { useState, useEffect, useRef } from "react";
import { sendMessage, getChatHistory } from "../api";
import "../style/Buyer.css";

export default function BuyerSellerChat({ user, partner }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  const room = [user, partner].sort().join("_");

  const loadMessages = async () => {
    const data = await getChatHistory(room);
    setMessages(data);
  };

  const sendMsg = async () => {
    if (!text.trim()) return;

    await sendMessage({
      sender: user,
      receiver: partner,
      text,
      room
    });

    setText("");
    loadMessages();
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="buyer-seller-chatbox">
      <div className="buyer-seller-chat-header">
        Chat with {partner}
      </div>

      <div className="buyer-seller-chat-body">
        {messages.map(msg => (
          <div key={msg.id} className={`msg ${msg.sender === user ? "sent" : "recv"}`}>
            <div className="bubble">{msg.text}</div>
            <small>{msg.timestamp}</small>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      <div className="buyer-seller-chat-input">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type message..."
        />
        <button onClick={sendMsg}>Send</button>
      </div>
    </div>
  );
}
