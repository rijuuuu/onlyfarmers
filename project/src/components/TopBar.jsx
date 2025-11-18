import "../style/TopBar.css";
import icon from "../icon/logo.png";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaBars,
  FaTimes,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

function TopBar() {
  const navigate = useNavigate();
  const userID = localStorage.getItem("uniqueID");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  const goToLogin = () => navigate("/login");
  const handleLogout = () => {
    localStorage.removeItem("uniqueID");
    localStorage.removeItem("userRole"); 
    goToHome();
    window.location.reload();
  };
  const goToHome = () => navigate("/home");
  const goToMarket = () => {
    const userID = localStorage.getItem("uniqueID");
    const role = (localStorage.getItem("userRole") || "").toLowerCase(); 

    if (!userID) {
      navigate("/login");
      return;
    }

    if (role === "farmer") {
      navigate("/farmer");
    } else if (role === "seller") {
      navigate("/seller");
    } else {
      navigate("/farmer");
    }
  };

  const handleNavigation = (path) => {
    navigate(`/${path}`);
    setMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="topbar">
      {/* LEFT: Logo */}
      <div className="name" onClick={goToHome}>
        <img src={icon} alt="icon" />
      </div>

      {/* CENTER: Market + More Options (desktop only) */}
      <div className="center-section">
        <p className="marketLink" onClick={goToMarket}>
          Market
        </p>

        <div className="menu-container" ref={dropdownRef}>
          <button className="menu-button" onClick={toggleMenu}>
            <p>More Options </p>
            <span className="menu-icon">
              {menuOpen ? (
                <FaChevronUp size={14} />
              ) : (
                <FaChevronDown size={14} />
              )}
            </span>
          </button>

          {menuOpen && (
            <div className="menu-dropdown">
              <p onClick={() => handleNavigation("crop_recommendation")}>
                Crop Recommendation
              </p>
              <p onClick={() => handleNavigation("disease_detection")}>
                Disease Detection
              </p>
              <p
                onClick={() => handleNavigation("fertilizer_pesticide_advice")}
              >
                Fertilizer & Pesticide Advice
              </p>
              <p onClick={() => handleNavigation("soil_health")}>Soil Health</p>
              <p onClick={() => handleNavigation("weather_query")}>
                Weather Query
              </p>
              <p onClick={() => handleNavigation("market_price_info")}>
                Market Price Info
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Theme Toggle + Login + Mobile Hamburger */}
      <div className="right-section">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          title={theme === "light" ? "Enable dark mode" : "Enable light mode"}
          type="button"
        >
          {theme === "light" ? <FaMoon size={16} /> : <FaSun size={16} />}
        </button>

        <button
          className={userID ? "logoutBtn" : "loginBtn"}
          onClick={userID ? handleLogout : goToLogin}
        >
          {userID ? "Logout" : "Login"}
        </button>

        {/* Mobile Hamburger */}
        <div className="hamburger" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            <p onClick={goToMarket}>Market</p>
            <p onClick={() => handleNavigation("crop_recommendation")}>
              Crop Recommendation
            </p>
            <p onClick={() => handleNavigation("disease_detection")}>
              Disease Detection
            </p>
            <p onClick={() => handleNavigation("fertilizer_pesticide_advice")}>
              Fertilizer & Pesticide Advice
            </p>
            <p onClick={() => handleNavigation("soil_health")}>Soil Health</p>
            <p onClick={() => handleNavigation("weather_query")}>
              Weather Query
            </p>
            <p onClick={() => handleNavigation("market_price_info")}>
              Market Price Info
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TopBar;