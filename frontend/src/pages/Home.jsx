 




import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div className="home-container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-heading">Social Media Analyzer</h1>
            <h2 className="hero-subheading">Optimize Your Social Media Strategy</h2>
            <p className="hero-description">
              Use data-driven insights to enhance engagement and improve your social media strategy.
            </p>
            <button
              className="cta-button"
              onClick={() => setShowAuthOptions(true)}
            >
              Get Started
            </button>
          </div>
        </div>

        <footer className="footer">
          <p>&copy; 2025 Social Media Analyzer. All rights reserved.</p>
        </footer>
      </div>

      {/* 🔹 Popup Modal outside home-container */}
      {showAuthOptions && (
        <div className="auth-overlay">
          <div className="auth-box">
            <h2>Welcome 👋</h2>
            <p>Please choose an option:</p>
            <div className="auth-buttons">
              <button onClick={() => navigate("/sign-in")}>Login</button>
              <button onClick={() => navigate("/sign-up")}>Sign Up</button>
            </div>
            <button
              className="close-btn"
              onClick={() => setShowAuthOptions(false)}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </>
  );
}
