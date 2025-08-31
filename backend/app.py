from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import io
import re
import tempfile
import pdfplumber
from PIL import Image
import pytesseract
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import textstat

# --- App setup ---
app = Flask(__name__)
CORS(app)

# 10 MB max upload
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}

sentiment = SentimentIntensityAnalyzer()

def allowed_file(filename: str) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            try:
                text_parts.append(page.extract_text() or "")
            except Exception:
                # fall back to page image OCR if text layer extraction fails
                pil = page.to_image(resolution=200).original
                text_parts.append(pytesseract.image_to_string(pil))
    return "\n".join(filter(None, text_parts)).strip()

def extract_text_from_image(file_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(file_bytes))
    # Convert to RGB to avoid issues with PNGs with alpha
    if image.mode != "RGB":
        image = image.convert("RGB")
    return pytesseract.image_to_string(image).strip()

URL_REGEX = re.compile(r"https?://\S+")
HASHTAG_REGEX = re.compile(r"(?:^|(?<=\\s))#[\\w_]+")
MENTION_REGEX = re.compile(r"(?:^|(?<=\\s))@[\\w_]+")
EMOJI_REGEX = re.compile("[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF"
                         "\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF"
                         "\U00002700-\U000027BF\U0001F900-\U0001F9FF]")

def analyze_text_for_engagement(text: str) -> dict:
    clean = text.strip()

    # Words and sentences
    words = re.findall(r"\b\w+\b", clean)  # <-- corrected raw regex
    sentences = re.split(r"[.!?]+\s*", clean)
    sentences = [s for s in sentences if s.strip()]
    word_count = len(words)
    char_count = len(clean)
    avg_sentence_len = (word_count / len(sentences)) if sentences else 0.0

    # Readability (guard against very short texts)
    try:
        flesch = textstat.flesch_reading_ease(clean) if word_count > 10 else None
        grade = textstat.text_standard(clean) if word_count > 10 else None
    except Exception:
        flesch = None
        grade = None

    # Sentiment
    vs = sentiment.polarity_scores(clean) if clean else {"compound": 0}

    # Social cues
    hashtags = HASHTAG_REGEX.findall(clean)
    mentions = MENTION_REGEX.findall(clean)
    links = URL_REGEX.findall(clean)
    emojis = EMOJI_REGEX.findall(clean)

    # Recommendations (simple heuristics)
    suggestions = []
    if word_count < 10:
        suggestions.append("Add more context—posts under ~10 words usually underperform.")
    if avg_sentence_len > 25:
        suggestions.append("Shorten sentences for scannability (aim for < 20 words).")
    if flesch is not None and flesch < 60:
        suggestions.append("Simplify wording to improve readability (Flesch < 60).")
    if not emojis:
        suggestions.append("Consider 1–2 relevant emojis to add personality (avoid overuse).")
    if len(hashtags) < 1:
        suggestions.append("Add 2–5 targeted hashtags to improve discovery.")
    if "call" not in clean.lower() and "check" not in clean.lower() and "learn" not in clean.lower():
        suggestions.append("Include a clear call-to-action (e.g., 'Learn more', 'Check the link').")
    if len(links) == 0:
        suggestions.append("Add a relevant link or mention where to find more info.")
    if vs.get("compound", 0) < -0.3:
        suggestions.append("Tone seems negative—reframe to be more constructive or positive.")

    return {
        "word_count": word_count,
        "char_count": char_count,
        "avg_sentence_len": round(avg_sentence_len, 2),
        "flesch_reading_ease": flesch,
        "readability_grade": grade,
        "sentiment": vs,
        "hashtags": hashtags,
        "mentions": mentions,
        "links": links,
        "emoji_count": len(emojis),
        "suggestions": suggestions,
    }


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    Accepts either:
      - multipart/form-data with file=<PDF or image>
      - application/json with {"text": "..."} for direct text analysis
    Returns JSON with extracted_text, metrics, and suggestions.
    """
    try:
        if request.is_json:
            payload = request.get_json(silent=True) or {}
            text = (payload.get("text") or "").strip()
            if not text:
                return jsonify({"error": "No text provided"}), 400
            metrics = analyze_text_for_engagement(text)
            return jsonify({"source": "raw_text", "extracted_text": text, "metrics": metrics})

        if "file" not in request.files:
            return jsonify({"error": "No file part named 'file'"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Unsupported file type"}), 415

        filename = secure_filename(file.filename)
        file_bytes = file.read()
        _, ext = os.path.splitext(filename.lower())

        if ext == ".pdf":
            extracted = extract_text_from_pdf(file_bytes)
            source = "pdf"
        else:
            extracted = extract_text_from_image(file_bytes)
            source = "image"

        if not extracted.strip():
            return jsonify({"source": source, "extracted_text": "", "metrics": {}, "warning": "No text detected."})

        metrics = analyze_text_for_engagement(extracted)
        return jsonify({"source": source, "extracted_text": extracted, "metrics": metrics})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # For local dev only; use a proper WSGI/ASGI server in production
    app.run(host="0.0.0.0", port=8000, debug=True)
 