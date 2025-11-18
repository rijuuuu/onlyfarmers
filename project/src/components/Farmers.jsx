import React, { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { recommend, createRequest, listRequests } from "../api"; 
import API from "../api"; 
import BuyerSellerChat from "./BuyerSellerChat"; 
import { FaStar, FaCalendarAlt, FaBullseye, FaPhone, FaMapMarkerAlt, FaHandshake } from "react-icons/fa";
import "../style/Farmers.css";

export default function Farmer() {
  const [crop, setCrop] = useState("");
  const [region, setRegion] = useState("");
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptedDeals, setAcceptedDeals] = useState([]);
  const [currentChatDeal, setCurrentChatDeal] = useState(null); 

  const farmer_id = localStorage.getItem("uniqueID");
  const farmer_name = localStorage.getItem("username");

  const handleSearch = async () => {
    if (!crop || !region) return toast.error("Enter crop & region");
    setLoading(true);
    try {
      const data = await recommend({ crop, region });
      setSellers(Array.isArray(data) ? data : []);
    } catch (e) {
      setSellers([]);
    }
    setLoading(false);
  };

  const sendReq = async (s) => {
    const price = prompt("Enter your price");
    if (!price || isNaN(price)) return toast.error("Invalid price");
    try {
      const payload = {
        farmer_id,
        farmer_name,
        crop: crop, // Use the crop from search input
        region: region, // Use the region from search input
        price,
        fpc_name: (s.fpc_name || s.FPC_Name || "").toString().toLowerCase(),
        fpc_id: s.fpc_id || ""
      };
      const j = await createRequest(payload);
      if (j && j.ok) toast.success("Request sent");
      else toast.error("Request failed");
    } catch (e) {
      toast.error("Request failed");
    }
  };

  const loadAccepted = async () => {
    try {
      const data = await listRequests({ farmer_id });
      setAcceptedDeals(Array.isArray(data) ? data.filter((r) => r.status === "accepted") : []);
    } catch {
      setAcceptedDeals([]);
    }
  };

  useEffect(() => {
    loadAccepted();
    const iv = setInterval(loadAccepted, 3000);
    return () => clearInterval(iv);
  }, []);

  const deleteReq = async (rid) => {
    if (!window.confirm("Delete permanently?")) return;
    try {
      await fetch(`${API}/api/request/delete/${rid}`, { method: "POST" });
      await loadAccepted();
    } catch {}
  };
  
  const handleOpenChat = (deal) => {
    const fpc_id = String(deal.fpc_id || "").trim();
    
    if (!fpc_id || !farmer_id) { 
        toast.error("Required IDs are missing for this deal. Cannot open chat.");
        return; 
    }

    setCurrentChatDeal(deal);
  };

  const handleCloseChat = () => {
    setCurrentChatDeal(null);
  }

  // FIX: UseEffect to toggle the global body class for scrolling
  useEffect(() => {
      if (currentChatDeal) {
          document.body.classList.add('chat-mode-active');
      } else {
          document.body.classList.remove('chat-mode-active');
      }
      return () => {
          document.body.classList.remove('chat-mode-active');
      };
  }, [currentChatDeal]);

  // Conditional Rendering: If a chat deal is active, show the chat window
  if (currentChatDeal) {
      const deal = currentChatDeal;
      const partnerId = String(deal.fpc_id).trim();
      const partnerName = deal.fpc_name;
      
      const farmerIdStr = String(farmer_id).toLowerCase();
      const fpcIdStr = String(partnerId).toLowerCase();

      const room = farmerIdStr < fpcIdStr
          ? `${farmerIdStr}_${fpcIdStr}`
          : `${fpcIdStr}_${farmerIdStr}`;

      return (
        <div className="farmer-panel"> 
          <Toaster />
          <BuyerSellerChat 
            user={farmer_id} 
            partnerId={partnerId} 
            partnerName={partnerName} 
            room={room} 
            onCloseChat={handleCloseChat}
          />
        </div>
      );
  }

  // Default rendering (Marketplace)
  return (
    <div className="farmer-panel">
      <Toaster />
      <h2>Farmer Marketplace</h2>

      <div className="search-box">
        <input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="Crop" />
        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" />
        <button onClick={handleSearch}>Search</button>
      </div>

      {loading && <p>Loading...</p>}

      <div className="seller-list">
        {sellers.map((s, i) => (
          <div key={i} className="seller-card">
            <div className="card-header">
              <div className="card-logo">{(s.FPC_Name || s.fpc_name || "F").charAt(0)}</div>
              <div className="card-header-text">
                <h3>{s.FPC_Name || s.fpc_name}</h3>
                <div className="card-location">
                  <FaMapMarkerAlt className="location-icon" />
                  <span>{s.District}</span>
                </div>
              </div>
            </div>
            <p className="commodities">Deals in: {s.Commodities}</p>
            
            <div className="card-stats">
              <div className="stat-item">
                <FaStar className="stat-icon star-icon" />
                <span className="stat-value">{s.Rating || 5}/10</span>
              </div>
              <div className="stat-item">
                <FaCalendarAlt className="stat-icon calendar-icon" />
                <span className="stat-value">{s.Years_of_Experience || 0} yrs</span>
              </div>
              <div className="stat-item">
                <FaBullseye className="stat-icon match-icon" />
                <span className="stat-value">
                  {s.match_percentage ? Number(s.match_percentage).toFixed(1) : "0.0"}%
                </span>
              </div>
            </div>

            {s.Contact_Phone && (
              <div className="card-phone">
                <FaPhone className="phone-icon" />
                <span>{s.Contact_Phone}</span>
              </div>
            )}

            <button className="send-request-btn" onClick={() => sendReq(s)}>
              {/* <FaHandshake className="btn-icon" /> */}
              Send Request
            </button>
          </div>
        ))}
      </div>

      <h2>Active Chats</h2>

      {acceptedDeals.map((d) => (
        <div key={d.id} className="deal-row">
          <div>
            <div className="deal-title">{d.fpc_name}</div>
            <div className="deal-info">
              {d.crop} • {d.region}
            </div>
          </div>

          <div className="deal-actions">
            <button className="open-chat" onClick={() => handleOpenChat(d)}>
              Open Chat
            </button>

            <button className="delete-btn" onClick={() => deleteReq(d.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}