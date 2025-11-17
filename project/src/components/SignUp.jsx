import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import "../style/Login.css";

export default function SignUp() {
  const [formData, setFormData] = useState({
    uniqueID: "",
    email: "",
    password: "",
    role: "",
    state: "",
    // --- NEW SELLER FIELDS (Initialized) ---
    fpcName: "",
    district: "",
    experience: "",
    commodities: [""],
  });

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman & Nicobar Islands",
    "Chandigarh",
    "Dadra & Nagar Haveli",
    "Daman & Diu",
    "Delhi",
    "Jammu & Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
  ];

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ---------------------------------------------------
  // Handlers (Unchanged)
  // ---------------------------------------------------
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCommodityChange = (index, value) => {
    const newCommodities = [...formData.commodities];
    newCommodities[index] = value;
    setFormData({ ...formData, commodities: newCommodities });
  };

  const addCommodityInput = () => {
    setFormData({ ...formData, commodities: [...formData.commodities, ""] });
  };

  const removeCommodityInput = (index) => {
    const newCommodities = formData.commodities.filter((_, i) => i !== index);
    setFormData({ ...formData, commodities: newCommodities });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    const {
      uniqueID,
      email,
      password,
      role,
      state,
      fpcName,
      district,
      experience,
      commodities,
    } = formData;

    // Validation logic (Unchanged)
    if (!uniqueID || !email || !password || !role || !state) {
      setError("Please fill all general fields.");
      setLoading(false);
      return;
    }

    if (
      role === "seller" &&
      (!fpcName ||
        !district ||
        !experience ||
        commodities.filter((c) => c.trim()).length === 0)
    ) {
      setError(
        "Sellers must provide FPC Name, District, Experience, and at least one Commodity."
      );
      setLoading(false);
      return;
    }

    setError("");

    try {
      const payload =
        role === "seller"
          ? { ...formData, commodities: commodities.filter((c) => c.trim()) }
          : formData;

      const response = await fetch("http://192.168.1.5:5000/signUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result = await response.json();

      if (response.ok) {
        localStorage.setItem("uniqueID", uniqueID);
        localStorage.setItem("role", role);
        toast.success("Signup successful! Please log in.");
        navigate("/Login");
      } else {
        setError(result.error || "Signup failed");
      }
    } catch (err) {
      setError("Server error. Please try again.");
      console.error("Signup Error:", err);
    }

    setLoading(false);
  };

  return (
    <div className="loginPage">
      <Toaster />
      <h1 className="login-title">Sign Up</h1>

      <form className="login-form" onSubmit={handleSubmit}>
        {/* --- GENERAL FIELDS --- */}
        <div>
          <input
            type="text"
            name="uniqueID"
            value={formData.uniqueID}
            onChange={handleChange}
            placeholder="Unique ID"
            className="form-input"
          />
        </div>
        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="form-input"
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="form-input"
          />
        </div>

        {/* --- STATE DROPDOWN --- */}
        <div>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="form-input dropdown-input"
          >
            <option value="">Select State</option>
            {indianStates.map((st, i) => (
              <option key={i} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* --- ROLE SELECTION --- */}
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

        {/* --- SELLER SPECIFIC FIELDS (Conditional Rendering) --- */}
        {formData.role === "seller" && (
          <div className="seller-fields">
            <h3 className="section-title">Seller Details 🏢</h3>
            <div>
              <input
                type="text"
                name="fpcName"
                value={formData.fpcName}
                onChange={handleChange}
                placeholder="FPC Name (e.g., Alipurduar FPC)"
                className="form-input"
                required
              />
            </div>
            <div>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="Operating District"
                className="form-input"
                required
              />
            </div>
            <div>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Years of Experience"
                className="form-input"
                required
              />
            </div>

            {/* Commodities List */}
            <div className="commodities-list">
              <label className="role-label">
                Commodities Sold (e.g., Wheat, Rice):
              </label>
              {formData.commodities.map((commodity, index) => (
                <div
                  key={index}
                  className="commodity-input-group"
                  style={{ display: "flex", gap: "10px" }}
                >
                  {" "}
                  {/* <-- Added Flex Layout Inline */}
                  <input
                    type="text"
                    value={commodity}
                    onChange={(e) =>
                      handleCommodityChange(index, e.target.value)
                    }
                    placeholder={`Commodity #${index + 1}`}
                    className="form-input"
                    style={{ flexGrow: 1 }}
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeCommodityInput(index)}
                      className="remove-btn"
                      style={{
                        flexShrink: 0,
                        padding: "5px 10px",
                        height: "fit-content",
                        alignSelf: "center",
                      }} // <-- Added style for visibility
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addCommodityInput}
                className="add-btn login-button"
              >
                + Add Another Commodity
              </button>
            </div>
          </div>
        )}
        {/* --- END SELLER FIELDS --- */}

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
