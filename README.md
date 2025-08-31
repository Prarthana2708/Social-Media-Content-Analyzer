# Social Media Content Analyzer

Web tool to analyze social media content by uploading PDFs or images, extracting text, and generating engagement metrics and suggestions.

✅ Features PDF parsing, OCR for images, readability scoring, sentiment analysis, hashtags, mentions, links, and emoji detection.

## Features

- Upload PDF/image files (`.pdf, .png, .jpg, .jpeg, .webp, .bmp, .tiff`)  
- Extract text and analyze: word/character count, sentence length, readability, sentiment, hashtags, mentions, links, emojis  
- Suggestions to improve engagement  
- Secure authentication with Clerk  
- Save analysis to Appwrite database  

## Tech Stack

- **Frontend:** React, Clerk, Appwrite  
- **Backend:** Flask, Flask-CORS, pdfplumber, pytesseract, PIL, vaderSentiment, textstat  
- **Database:** Appwrite  

## Setup

**Backend:**  
```bash
cd backend
python -m venv venv
# Activate:
.\venv\Scripts\Activate (Windows) | source venv/bin/activate (macOS/Linux)
pip install -r requirements.txt
python app.py

**Frontend**:

cd frontend
npm install
npm run dev

Backend: http://127.0.0.1:8000
Frontend: http://localhost:5173
Requires Clerk Publishable Key in .env.local

Usage

Sign in via Clerk → Upload PDF/image → Click Analyze → View text, metrics & suggestions.

**Notes**

Max upload size: 10 MB
Supported: .pdf, .png, .jpg, .jpeg, .webp, .bmp, .tiff
For production, run behind a WSGI server (gunicorn/uvicorn) and set CORS origins

GitHub: Add your repository link here.