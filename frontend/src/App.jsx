
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home.jsx";
import Analyze from "./pages/Analyze.jsx";

import {
  SignIn,
  SignUp,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";

function App() {
   
  const centerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100%",
    background: "##e3f0ff",  
  };

 
  const authBoxStyle = {
    width: "480px",
    maxWidth: "90%",
    padding: "50px 40px",
    borderRadius: "20px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
    background: "#1e3a8a",  
    color: "#ffffff",      
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };
 
  const signWrapperStyle = {
    width: "100%",
  };
   
  
  return (
    <Routes>
      {/* Public Home */}
      <Route path="/" element={<Home />} />

      {/* Sign In Page */}
      <Route
        path="/sign-in/*"
        element={
          <div style={centerStyle}>
            <div style={authBoxStyle}>
              <div style={signWrapperStyle}>
                <SignIn
                  routing="path"
                  path="/sign-in"
                  redirectUrl="/analyze"
                />
              </div>
            </div>
          </div>
        }
      />

      {/* Sign Up Page */}
      <Route
        path="/sign-up/*"
        element={
          <div style={centerStyle}>
            <div style={authBoxStyle}>
              <div style={signWrapperStyle}>
                <SignUp
                  routing="path"
                  path="/sign-up"
                  redirectUrl="/analyze"
                />
              </div>
            </div>
          </div>
        }
      />

      {/* Protected Analyze Page */}
      <Route
        path="/analyze"
        element={
          <>
            <SignedIn>
              <Analyze />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
