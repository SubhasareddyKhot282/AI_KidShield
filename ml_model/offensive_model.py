"""
ml_model/offensive_model.py
━━━━━━━━━━━━━━━━━━━━━━━━━━
SafeGuard AI — ML Offensive Content Detector
Uses cardiffnlp/twitter-roberta-base-offensive (HuggingFace)
Falls back to keyword-based detection if transformers unavailable.
"""

import re
import os
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

# ── Keyword-based fallback (always available, no GPU needed) ──────────────────
HARMFUL_KEYWORDS = {
    "drugs": [
        "weed", "cocaine", "heroin", "meth", "amphetamine", "ecstasy", "mdma",
        "lsd", "acid", "crack", "narcotics", "marijuana", "cannabis", "buy drugs",
        "drug dealer", "how to get high", "drug overdose", "fentanyl", "opioid",
    ],
    "dangerous_challenges": [
        "blue whale challenge", "blue whale task", "momo challenge",
        "blackout challenge", "tide pod challenge", "fire challenge",
        "skull breaker", "48 hour challenge", "self harm task",
        "challenge task list", "dangerous dare",
    ],
    "violence": [
        "how to kill", "bomb making", "shoot everyone", "murder plan",
        "weapon build", "kill myself", "mass shooting", "terrorist attack",
        "how to fight", "beat up", "stab",
    ],
    "abusive": [
        "idiot", "loser", "stupid", "dumb", "moron", "retard",
        "hate you", "go die", "shut up", "b***h", "f***", "s***",
        "a**hole", "bastard", "freak",
    ],
    "adult": [
        "porn", "xxx", "nude", "naked", "sex video", "adult content",
        "only fans", "explicit", "erotic",
    ],
    "phishing": [
        "free coins", "win prize", "claim reward", "verify account now",
        "click here to win", "you have been selected", "send me your password",
        "bank account verify", "otp share",
    ],
}

CATEGORY_SEVERITY = {
    "drugs": "critical",
    "dangerous_challenges": "critical",
    "violence": "critical",
    "adult": "high",
    "abusive": "medium",
    "phishing": "high",
}


class KeywordDetector:
    """Fast keyword-based harmful content detector (no ML dependency)."""

    def predict(self, text: str) -> Tuple[int, float, str]:
        """
        Returns: (is_harmful: 0|1, confidence: float, category: str)
        """
        text_lower = text.lower()
        for category, keywords in HARMFUL_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    return 1, 0.95, category
        return 0, 0.05, "safe"

    def predict_batch(self, texts):
        return [self.predict(t) for t in texts]


class OffensiveContentDetector:
    """
    Primary ML detector using HuggingFace RoBERTa model.
    Falls back to KeywordDetector if transformers is not installed.
    """

    def __init__(
        self,
        model_name: str = "cardiffnlp/twitter-roberta-base-offensive",
        threshold: float = 0.50,
    ):
        self.threshold = threshold
        self.model_name = model_name
        self._model = None
        self._tokenizer = None
        self._keyword_detector = KeywordDetector()
        self._ml_available = False
        self._load_model()

    def _load_model(self):
        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import torch
            logger.info(f"[ML] Loading model: {self.model_name}")
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self._model = AutoModelForSequenceClassification.from_pretrained(
                self.model_name
            )
            self._model.eval()
            self._ml_available = True
            logger.info("[ML] Model loaded successfully ✓")
        except Exception as e:
            logger.warning(
                f"[ML] Transformers unavailable ({e}). Using keyword fallback."
            )
            self._ml_available = False

    def predict(self, text: str) -> Tuple[int, float, str]:
        """
        Analyze text for harmful content.
        Returns (label: 0|1, confidence: float 0-1, category: str)
        """
        # Always run keyword check first (catches explicit harmful terms)
        kw_label, kw_conf, kw_cat = self._keyword_detector.predict(text)
        if kw_label == 1:
            return 1, kw_conf, kw_cat

        # Then run ML model if available
        if self._ml_available:
            try:
                import torch
                import torch.nn.functional as F

                inputs = self._tokenizer(
                    text,
                    return_tensors="pt",
                    truncation=True,
                    max_length=128,
                )
                with torch.no_grad():
                    outputs = self._model(**inputs)
                probs = F.softmax(outputs.logits, dim=1)
                offensive_prob = probs[0][1].item()
                if offensive_prob >= self.threshold:
                    return 1, round(offensive_prob, 4), "abusive"
                return 0, round(1 - offensive_prob, 4), "safe"
            except Exception as e:
                logger.error(f"[ML] Prediction error: {e}")

        return 0, 0.10, "safe"

    def get_severity(self, category: str) -> str:
        return CATEGORY_SEVERITY.get(category, "low")

    def analyze(self, text: str) -> dict:
        """Full analysis result as dictionary."""
        label, confidence, category = self.predict(text)
        return {
            "text": text[:200],
            "is_harmful": bool(label),
            "confidence": round(confidence * 100, 1),
            "category": category,
            "severity": self.get_severity(category) if label else "safe",
            "model": self.model_name if self._ml_available else "keyword-fallback",
        }


# ── URL / Phishing Detector ──────────────────────────────────────────────────

PHISHING_PATTERNS = [
    r"free.?coin", r"win.?prize", r"claim.?reward", r"verify.?account",
    r"secure.?login", r"update.?payment", r"password.?reset.?urgent",
    r"you.?won", r"congratulations.?selected",
]

MALICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".onion", ".ru", ".cn"]

SUSPICIOUS_KEYWORDS_URL = [
    "darkweb", "drug", "porn", "xxx", "adult-stream", "hack", "crack",
    "warez", "torrent-free", "keygen", "serial-key",
]

WHITELIST_DOMAINS = [
    "google.com", "youtube.com", "khanacademy.org", "wikipedia.org",
    "github.com", "microsoft.com", "apple.com", "amazon.com",
    "gmail.com", "outlook.com", "zoom.us", "meet.google.com",
    "classroom.google.com", "duolingo.com", "coursera.org", "edx.org",
    "nationalgeographic.com", "nasa.gov", "bbc.com", "britannica.com",
]


class URLChecker:
    def check(self, url: str) -> dict:
        url_lower = url.lower().strip()

        # Whitelist
        for safe in WHITELIST_DOMAINS:
            if safe in url_lower:
                return {
                    "url": url,
                    "status": "safe",
                    "verdict": "WHITELISTED — Safe educational/trusted domain",
                    "risk_level": 0,
                    "action": "allowed",
                }

        # Malicious TLD
        for tld in MALICIOUS_TLDS:
            if url_lower.endswith(tld) or f"{tld}/" in url_lower:
                return {
                    "url": url,
                    "status": "malicious",
                    "verdict": f"MALICIOUS — Dangerous TLD detected: {tld}",
                    "risk_level": 95,
                    "action": "blocked",
                }

        # Phishing patterns
        for pattern in PHISHING_PATTERNS:
            if re.search(pattern, url_lower):
                return {
                    "url": url,
                    "status": "phishing",
                    "verdict": "PHISHING — URL matches known phishing pattern",
                    "risk_level": 90,
                    "action": "blocked",
                }

        # Suspicious keywords
        for kw in SUSPICIOUS_KEYWORDS_URL:
            if kw in url_lower:
                return {
                    "url": url,
                    "status": "suspicious",
                    "verdict": f"SUSPICIOUS — Contains harmful keyword: '{kw}'",
                    "risk_level": 70,
                    "action": "flagged",
                }

        # Shortened URL
        if any(s in url_lower for s in ["bit.ly", "tinyurl", "t.co", "goo.gl", "ow.ly"]):
            return {
                "url": url,
                "status": "suspicious",
                "verdict": "SUSPICIOUS — Shortened URL may redirect to harmful content",
                "risk_level": 55,
                "action": "flagged",
            }

        # IP address URL
        if re.match(r"https?://\d+\.\d+\.\d+\.\d+", url_lower):
            return {
                "url": url,
                "status": "suspicious",
                "verdict": "SUSPICIOUS — Direct IP address URL (no domain name)",
                "risk_level": 65,
                "action": "flagged",
            }

        return {
            "url": url,
            "status": "unknown",
            "verdict": "UNVERIFIED — Not in whitelist. Manual review recommended.",
            "risk_level": 30,
            "action": "review",
        }
