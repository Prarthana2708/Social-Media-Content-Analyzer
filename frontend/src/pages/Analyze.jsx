import React, { useState } from "react";
import "./Analyze.css";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { databases } from "../appwrite";
import ReactMarkdown from "react-markdown"; // ✅ Markdown renderer

export default function Analyze() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { signOut } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setText("");
    setMetrics(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setText(data.extracted_text || "No text extracted.");
        setMetrics(data.metrics);

        // ✅ Save result into Appwrite DB
        await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DB_ID,
          import.meta.env.VITE_APPWRITE_COLLECTION_ID,
          "unique()", // Auto-generate ID
          {
            user_id: user.$id,
            fileName: file.name,
            extractedText: data.extracted_text,
          }
        );
      } else {
        setError(data.error || "Analysis failed");
      }
    } catch (err) {
      setError("Server error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyze-wrapper">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Analyzing...</p>
        </div>
      )}

      <h1>Social Media Content Analyzer</h1>

      <div
        className={`drop-zone ${file ? "has-file" : ""}`}
        onClick={() => document.getElementById("fileInput").click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
          }
        }}
      >
        {file ? `📄 ${file.name}` : "Drag & drop a PDF/Image here or click to upload"}
        <input
          id="fileInput"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ display: "none" }}
        />
      </div>

      <button onClick={handleFileUpload} disabled={!file || loading}>
        {loading ? "Analyzing..." : "Analyze Now"}
      </button>

      {error && <p className="error">{error}</p>}

      {text && (
        <div className="results card">
          <h2>📜 Extracted Text</h2>
          {/* ✅ Render formatted text using Markdown */}
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      )}

      {metrics && (
        <div className="metrics card">
          <h2>📊 Analysis Metrics</h2>
          <ul>
            <li>
              Word count: <strong>{metrics.word_count}</strong>
            </li>
            <li>
              Character count: <strong>{metrics.char_count}</strong>
            </li>
            <li>
              Average sentence length: <strong>{metrics.avg_sentence_len}</strong>
            </li>
            <li>
              Flesch Reading Ease: <strong>{metrics.flesch_reading_ease}</strong>
            </li>
            <li>
              Readability Grade: <strong>{metrics.readability_grade}</strong>
            </li>
            <li>
              Emojis: <strong>{metrics.emoji_count}</strong>
            </li>
            <li>
              Hashtags: <strong>{metrics.hashtags.join(", ") || "None"}</strong>
            </li>
            <li>
              Mentions: <strong>{metrics.mentions.join(", ") || "None"}</strong>
            </li>
            <li>
              Links: <strong>{metrics.links.join(", ") || "None"}</strong>
            </li>
          </ul>
          {metrics.suggestions && metrics.suggestions.length > 0 && (
            <>
              <h3>💡 Suggestions:</h3>
              <ul>
                {metrics.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <br />

      {/* 🔴 Logout Button */}
      <button onClick={() => setShowLogoutModal(true)} className="logout-btn">
        Logout
      </button>

      {/* 🔴 Custom Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div className="modal-buttons">
              <button className="btn cancel" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="btn confirm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
 