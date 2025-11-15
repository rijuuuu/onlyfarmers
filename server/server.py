import os
import uuid
import time
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from web3 import Web3

try:
    from src.vectorstore import FaissVectorStore
    from src.search import RAGSearch
except Exception:
    FaissVectorStore = None
    RAGSearch = None

import warnings
warnings.filterwarnings("ignore")

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/krishiMitra")
app.config["MONGO_URI"] = MONGO_URI
mongo = PyMongo(app)

INFURA_URL = os.getenv("INFURA_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PORT = int(os.getenv("PORT", "5000"))

ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "farmer", "type": "address"},
            {"internalType": "address", "name": "seller", "type": "address"},
            {"internalType": "string", "name": "crop", "type": "string"},
            {"internalType": "string", "name": "region", "type": "string"},
            {"internalType": "uint256", "name": "price", "type": "uint256"},
        ],
        "name": "createDeal",
        "outputs": [{"internalType": "bytes32", "name": "dealId", "type": "bytes32"}],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

def normalize_text(t: str) -> str:
    return str(t or "").lower().replace(" ", "").replace("-", "").replace("_", "")

def get_web3():
    if not INFURA_URL:
        raise RuntimeError("INFURA_URL is not set in environment.")
    w3 = Web3(Web3.HTTPProvider(INFURA_URL))
    try:
        if callable(getattr(w3, "is_connected", None)):
            ok = w3.is_connected()
        else:
            ok = w3.isConnected()
    except Exception:
        ok = False
    if not ok:
        raise RuntimeError("Cannot connect to blockchain provider.")
    return w3

def create_blockchain_deal(crop, region, price, farmer_address=None, seller_address=None):
    if not PRIVATE_KEY or not CONTRACT_ADDRESS:
        return None
    try:
        w3 = get_web3()
        acct = w3.eth.account.from_key(PRIVATE_KEY)
        farmer_addr = farmer_address or acct.address
        seller_addr = seller_address or acct.address
        contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI)
        nonce = w3.eth.get_transaction_count(acct.address)
        gas_price = w3.to_wei("10", "gwei")
        txn = contract.functions.createDeal(
            w3.to_checksum_address(farmer_addr),
            w3.to_checksum_address(seller_addr),
            str(crop),
            str(region),
            int(price)
        ).build_transaction({
            "from": acct.address,
            "nonce": nonce,
            "gas": 300000,
            "gasPrice": gas_price,
        })
        signed = acct.sign_transaction(txn)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        return tx_hash.hex()
    except Exception:
        return None

def load_sellers(path="data/FPC_sample_alipurduar.csv"):
    base_cols = ["FPC_Name", "District", "Commodities", "Email", "Address", "Contact_Phone"]
    if not os.path.exists(path):
        return pd.DataFrame(columns=base_cols)
    try:
        df = pd.read_csv(path, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(path, encoding="cp1252")
    except Exception:
        return pd.DataFrame(columns=base_cols)
    df.columns = [c.strip().replace(" ", "_") for c in df.columns]
    for c in base_cols:
        if c not in df:
            df[c] = ""
        df[c] = df[c].fillna("").astype(str)
    df["seller_id"] = df["FPC_Name"].astype(str).str.replace(r"[^a-zA-Z0-9]", "", regex=True)
    return df

SELLERS = load_sellers()

def train_vectorizer(df):
    if df is None or df.empty:
        return TfidfVectorizer(stop_words="english"), np.zeros((0, 0))
    df = df.copy()
    df["combined_text"] = (
        df["FPC_Name"].fillna("") + " " +
        df["District"].fillna("") + " " +
        df["Commodities"].fillna("") + " " +
        df["Address"].fillna("")
    )
    vec = TfidfVectorizer(stop_words="english")
    try:
        mat = vec.fit_transform(df["combined_text"].astype(str))
    except Exception:
        mat = np.zeros((0, 0))
    return vec, mat

VEC, MAT = train_vectorizer(SELLERS)

rag = None
if FaissVectorStore is not None and RAGSearch is not None:
    try:
        store = FaissVectorStore("faiss_store")
        store.load()
        rag = RAGSearch(vector_store=store)
    except Exception:
        rag = None

REQUESTS = []
NOTIFS = []
CHATS = []

@app.post("/signUp")
def signUp():
    data = request.get_json() or {}
    uid = data.get("uniqueID")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")
    state = data.get("state")
    if not uid or not email or not password or not role or not state:
        return jsonify({"error": "Missing fields"}), 400
    if mongo.db.users.find_one({"_id": uid}) or mongo.db.users.find_one({"email": email}):
        return jsonify({"error": "This ID or email is already taken."}), 400
    hashed = generate_password_hash(password)
    mongo.db.users.insert_one({
        "_id": uid,
        "email": email,
        "password": hashed,
        "role": role,
        "state": state
    })
    return jsonify({"message": "Signup successful", "user": uid}), 201

@app.post("/login")
def login():
    data = request.get_json() or {}
    uid = data.get("uniqueID")
    pw = data.get("password")
    if not uid or not pw:
        return jsonify({"error": "Missing fields"}), 400
    user = mongo.db.users.find_one({"_id": uid})
    if not user:
        return jsonify({"error": "Invalid userID"}), 400
    if not check_password_hash(user["password"], pw):
        return jsonify({"error": "Wrong password"}), 400
    return jsonify({"message": "Login successful", "user": uid, "role": user.get("role")}), 200

@app.post("/api/recommend")
def recommend():
    data = request.get_json() or {}
    crop_input = (data.get("crop") or "").strip().lower()
    region_input = (data.get("region") or "").strip().lower()
    crop_keywords = [k.strip().lower() for k in crop_input.split(",") if k.strip()]
    region_clean = normalize_text(region_input)
    if not crop_keywords or not region_clean:
        return jsonify([]), 200
    def commodity_match(commodities):
        text = normalize_text(commodities)
        return any(normalize_text(k) in text for k in crop_keywords)
    def district_match(district):
        return normalize_text(district) == region_clean
    filtered = SELLERS[
        SELLERS.apply(
            lambda row: commodity_match(row["Commodities"]) and district_match(row["District"]),
            axis=1
        )
    ].copy()
    if filtered.empty:
        return jsonify([]), 200
    try:
        query = f"{crop_input} {region_input}".strip()
        qv = VEC.transform([query])
        sims = cosine_similarity(qv, MAT).flatten()
        filtered["match_score"] = sims[filtered.index]
        filtered = filtered.sort_values("match_score", ascending=False)
    except Exception:
        pass
    top_result = filtered[[
        "FPC_Name",
        "District",
        "Commodities",
        "Email",
        "Contact_Phone",
        "seller_id"
    ]].head(1).to_dict(orient="records")
    return jsonify(top_result), 200

@app.post("/api/request")
def create_request():
    data = request.get_json() or {}
    farmer_id = data.get("farmer_id")
    farmer_name = data.get("farmer_name")
    crop = data.get("crop")
    region = data.get("region")
    price = data.get("price", 0)
    seller_id = data.get("seller_id")
    if not farmer_id or not farmer_name or not crop or not region or not seller_id:
        return jsonify({"error": "Missing required fields"}), 400
    try:
        price_int = int(price)
    except Exception:
        price_int = 0
    rid = str(uuid.uuid4())
    req = {
        "id": rid,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "farmer_id": farmer_id,
        "farmer_name": farmer_name,
        "crop": crop,
        "region": region,
        "price": price_int,
        "seller_id": seller_id,
        "status": "pending",
    }
    REQUESTS.append(req)
    NOTIFS.append({"to": seller_id, "msg": f"Farmer {farmer_name} wants to connect for {crop} in {region}"})
    return jsonify({"ok": True, "request_id": rid}), 201

@app.get("/api/requests")
def list_requests():
    farmer_id = request.args.get("farmer_id")
    seller_id = request.args.get("seller_id")
    results = REQUESTS
    if farmer_id:
        results = [r for r in results if r.get("farmer_id") == farmer_id]
    if seller_id:
        results = [r for r in results if r.get("seller_id") == seller_id]
    return jsonify(results), 200

@app.post("/api/accept/<rid>")
def accept_request(rid):
    for r in REQUESTS:
        if r["id"] == rid and r["status"] == "pending":
            tx = create_blockchain_deal(r["crop"], r["region"], r["price"])
            r["status"] = "accepted"
            r["tx_hash"] = tx
            return jsonify({"ok": True, "tx_hash": tx}), 200
    return jsonify({"ok": False}), 404

@app.post("/api/reject/<rid>")
def reject_request(rid):
    for r in REQUESTS:
        if r["id"] == rid and r["status"] == "pending":
            r["status"] = "rejected"
            return jsonify({"ok": True}), 200
    return jsonify({"ok": False}), 404

@app.get("/api/notifications")
def notifications():
    seller = request.args.get("seller")
    return jsonify([n for n in NOTIFS if n.get("to") == seller]), 200

@app.post("/api/chat/send")
def send_message():
    data = request.get_json() or {}
    sender = data.get("sender")
    receiver = data.get("receiver")
    text = data.get("text")
    room = data.get("room")
    if not sender or not receiver or not text or not room:
        return jsonify({"ok": False, "error": "Missing sender/receiver/text/room"}), 400
    msg = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "sender": sender,
        "receiver": receiver,
        "text": text,
        "room": room,
    }
    CHATS.append(msg)
    return jsonify({"ok": True, "msg": msg}), 201

@app.get("/api/chat/history")
def chat_history():
    room = request.args.get("room")
    if not room:
        return jsonify({"ok": False, "error": "room required"}), 400
    messages = [m for m in CHATS if m.get("room") == room]
    return jsonify(messages), 200

@app.post("/chatbot")
def chatbot():
    if rag is None:
        return jsonify({"error": "RAG not ready"}), 503
    data = request.get_json() or {}
    user_input = (data.get("message") or "").strip()
    if not user_input:
        return jsonify({"error": "Empty message"}), 400
    try:
        ans = rag.search_and_summarize(user_input)
        return jsonify({"reply": ans}), 200
    except Exception:
        return jsonify({"error": "RAG search failed"}), 500

@app.post("/api/crops/add")
def add_crop():
    data = request.get_json() or {}
    userID = data.get("userID")
    text = data.get("text")
    date = data.get("date")
    if not userID or not text or not date:
        return jsonify({"error": "Missing fields"}), 400
    mongo.db.crops.insert_one({
        "userID": userID,
        "text": text,
        "date": date
    })
    return jsonify({"message": "Crop saved"}), 201

@app.get("/api/crops/get")
def get_crops():
    userID = request.args.get("userID")
    if not userID:
        return jsonify({"error": "userID required"}), 400
    crops = list(mongo.db.crops.find({"userID": userID}, {"_id": 0}))
    return jsonify(crops), 200

@app.get("/")
def home():
    return "🌾 AgriConnect + KrishiMitra API Running!"

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
