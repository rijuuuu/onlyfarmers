import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../style/Login.css";

export default function Login() {
  const [formData, setFormData] = useState({
    uniqueID: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { uniqueID, password } = formData;

    if (!uniqueID || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://192.168.1.5:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueID, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("uniqueID", uniqueID);
        localStorage.setItem("userRole", result.role || "");

        navigate("/home", { replace: true });  // 🔥 FIX — ABSOLUTE PATH ALWAYS
      } else {
        setError(result.error || "Invalid login credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <h1 className="login-title">Login</h1>

      <form className="login-form" onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            name="uniqueID"
            className="form-input"
            value={formData.uniqueID}
            onChange={handleChange}
            placeholder="Unique ID"
            autoComplete="username"
          />
        </div>

        <div>
          <input
            type="password"
            name="password"
            className="form-input"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="signup-text">
        Don't have an account?{" "}
        <Link to="/signUp" className="signup-link">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
