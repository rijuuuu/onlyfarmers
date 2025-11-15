import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";

import Home from "./components/Home";
import TopBar from "./components/TopBar";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Buyer from "./components/Buyer";
import Seller from "./components/Seller";

export default function App() {
  return (
    <Router>
      <TopBar />

      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* Market Routes */}
        {/* <Route path="/farmer" element={<Farmer />} />   Farmer Dashboard */}
        {/* <Route path="/seller" element={<Seller />} />   Seller Dashboard */}

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        {/* Market Routes */}
        <Route path="/buyer" element={<Buyer />} />
        <Route path="/seller" element={<Seller />} />
      </Routes>
    </Router>
  );
}
