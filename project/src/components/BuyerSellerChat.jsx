import { useState, useEffect } from "react";
import { sendMessage, getChatHistory } from "../api";

export default function BuyerSellerChat({ user, partner, room }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const load = async () => {
    const res = await getChatHistory(room);
    if (Array.isArray(res)) setMessages(res);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 2000);
    return () => clearInterval(iv);
  }, [room]);

  const send = async () => {
    if (!text.trim()) return;
    await sendMessage({
      sender: user,
      receiver: partner,
      text,
      room,
    });
    setText("");
    load();
  };

  return (
    <div className="buyer-seller-chatbox">
      <div className="buyer-seller-chat-header">Chat</div>

      <div className="buyer-seller-chat-body">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`msg ${m.sender === user ? "sent" : "recv"}`}
          >
            <div className="bubble">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="buyer-seller-chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message…"
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
