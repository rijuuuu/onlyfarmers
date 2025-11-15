import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../style/Login.css";

export default function SignUp() {
  const [formData, setFormData] = useState({
    uniqueID: "",
    email: "",
    password: "",
    role: "",
    state: "",   // NEW FIELD
  });

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli",
    "Daman & Diu", "Delhi", "Jammu & Kashmir", "Ladakh", "Lakshadweep",
    "Puducherry"
  ];

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
    if (loading) return;

    setLoading(true);

    const { uniqueID, email, password, role, state } = formData;

    if (!uniqueID || !email || !password || !role || !state) {
      setError("Please fill all fields, including user type and state.");
      setLoading(false);
      return;
    }

    setError("");

    try {
      const response = await fetch("http://192.168.0.104:5000/signUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let result = await response.json();

      if (response.ok) {
        localStorage.setItem("uniqueID", uniqueID);
        localStorage.setItem("role", role);
        navigate("/Login");
      } else {
        setError(result.error || "Signup failed");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="loginPage">
      <h1 className="login-title">Sign Up</h1>

      <form onSubmit={handleSubmit}>

        <div>
          <input
            type="text"
            name="uniqueID"
            value={formData.uniqueID}
            onChange={handleChange}
            placeholder="Unique ID"
          />
        </div>

        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
          />
        </div>

        <div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
          />
        </div>

        {/* 🔥 STATE DROPDOWN */}
        <div>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="dropdown-input"
          >
            <option value="">Select State</option>
            {indianStates.map((st, i) => (
              <option key={i} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* 🔥 Role selection */}
        <div className="role-box">
          <p className="role-label">Select User Type:</p>

          <div className="role-options">
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="farmer"
                checked={formData.role === "farmer"}
                onChange={handleChange}
              />
              <span>Farmer</span>
            </label>

            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="seller"
                checked={formData.role === "seller"}
                onChange={handleChange}
              />
              <span>Seller</span>
            </label>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading} className="login-button">
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>

      <p className="signup-text">
        Already have an account?{" "}
        <Link to="/Login" className="signup-link">
          Login
        </Link>
      </p>
    </div>
  );
}
