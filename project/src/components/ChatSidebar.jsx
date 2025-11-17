import React, { useEffect, useState } from "react";
import BuyerSellerChat from "./BuyerSellerChat";
import API from "../api";
import "../style/ChatSidebar.css";

export default function ChatSidebar({ open, onClose, userID }) {
  const [role] = useState(localStorage.getItem("role") || "farmer");
  const [uniqueID] = useState(userID || localStorage.getItem("uniqueID"));
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);

  const loadChats = async () => {
    let url =
      role === "seller"
        ? `${API}/api/requests?fpc_id=${uniqueID}`
        : `${API}/api/requests?farmer_id=${uniqueID}`;

    const res = await fetch(url);
    const data = await res.json();
    const accepted = Array.isArray(data)
      ? data.filter((r) => r.status === "accepted")
      : [];

    setChats(accepted);
    if (!accepted.length) setActive(null);
  };

  useEffect(() => {
    if (open) loadChats();
    const iv = setInterval(() => {
      if (open) loadChats();
    }, 2000);
    return () => clearInterval(iv);
  }, [open]);

  const del = async (rid) => {
    await fetch(`${API}/api/request/delete/${rid}`, { method: "POST" });
    setActive(null);
    loadChats();
  };

  return (
    <div className={`chat-sidebar ${open ? "open" : ""}`} role="dialog" inert={!open}>
      <div className="chat-sidebar-header">
        <div className="chat-sidebar-title">Chats</div>
        <button className="chat-sidebar-close" onClick={onClose}>✕</button>
      </div>

      <div className="chat-list">
        {chats.map((c) => {
          const partnerName = role === "seller" ? c.farmer_name : c.fpc_name;
          const partnerId = role === "seller" ? c.farmer_id : c.fpc_id;

          const room =
            String(c.farmer_id).toLowerCase() <
            String(c.fpc_id).toLowerCase()
              ? `${c.farmer_id}_${c.fpc_id}`
              : `${c.fpc_id}_${c.farmer_id}`;

          return (
            <div
              key={c.id}
              className="chat-list-item"
              onClick={() => setActive({ c, partnerId, room })}
            >
              <div className="chat-list-title">{partnerName}</div>
              <div className="chat-list-sub">{c.crop} • {c.region}</div>

              <button className="chat-delete-btn" onClick={(e) => { e.stopPropagation(); del(c.id); }}>
                Delete
              </button>
            </div>
          );
        })}
      </div>

      <div className="chat-active-window">
        {active ? (
          <BuyerSellerChat
            user={uniqueID}
            partner={active.partnerId}
            room={active.room}
          />
        ) : (
          <div className="select-chat-hint">Select chat</div>
        )}
      </div>
    </div>
  );
}
