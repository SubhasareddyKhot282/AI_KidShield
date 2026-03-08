"""
backend/app.py
━━━━━━━━━━━━━━
SafeGuard AI — Flask Backend API
Parent Dashboard + Real-time WebSocket + REST API
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv

# Path setup
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from database.models import db, Alert, ActivityLog, URLLog, KeylogEntry
from ml_model.offensive_model import OffensiveContentDetector, URLChecker
from backend.email_service import EmailAlertService

# ── App Setup ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("safeguard_server.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

app = Flask(
    __name__,
    template_folder=os.path.join(os.path.dirname(__file__), "..", "frontend"),
    static_folder=os.path.join(os.path.dirname(__file__), "..", "frontend", "static"),
)

app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "safeguard_dev_secret")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///safeguard.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")
db.init_app(app)

# Singletons
detector = OffensiveContentDetector(
    model_name=os.getenv("ML_MODEL_NAME", "cardiffnlp/twitter-roberta-base-offensive"),
    threshold=float(os.getenv("ML_THRESHOLD", "0.50")),
)
url_checker = URLChecker()
email_service = EmailAlertService()

SCREENSHOT_DIR = os.getenv("SCREENSHOT_DIR", "screenshots")
AUDIO_DIR = os.getenv("AUDIO_DIR", "audio")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)


# ── Database Init ──────────────────────────────────────────────────────────────
def seed_demo_data():
    """Seed demo data if DB is empty (for presentation/testing)."""
    if Alert.query.count() > 0:
        return

    logger.info("[DB] Seeding demo data...")
    import random
    from datetime import datetime, timedelta

    demo_alerts = [
        ("blue whale challenge task list", "dangerous_challenges", "critical", 96.4, "Chrome"),
        ("how to buy drugs online cheap", "drugs", "critical", 92.1, "Chrome"),
        ("bro try some weed it's chill", "drugs", "critical", 88.3, "WhatsApp"),
        ("free-coins-now.tk login page", "phishing", "high", 85.0, "Chrome"),
        ("violent kill cheat codes game", "violence", "medium", 67.2, "YouTube"),
        ("adult-stream-hd.ru video", "adult", "high", 91.0, "Chrome"),
        ("I hate you loser go die", "abusive", "medium", 73.5, "WhatsApp"),
    ]

    for i, (content, category, severity, confidence, app) in enumerate(demo_alerts):
        ts = datetime.utcnow() - timedelta(hours=i * 2, minutes=random.randint(0, 59))
        alert = Alert(
            timestamp=ts,
            content=content,
            category=category,
            severity=severity,
            confidence=confidence,
            application=app,
            email_sent=True,
            action_taken="alert_sent",
            child_name=os.getenv("CHILD_NAME", "Aarav"),
        )
        db.session.add(alert)

    demo_activity = [
        ("Chrome", "search", "how to make lemonade recipe", False, "safe", 0),
        ("Chrome", "url", "khanacademy.org/math", False, "safe", 0),
        ("Chrome", "search", "blue whale challenge task list", True, "dangerous_challenges", 95),
        ("WhatsApp", "message", "bro try some weed it's chill", True, "drugs", 88),
        ("Chrome", "url", "free-coins-now.tk", True, "phishing", 90),
        ("YouTube", "search", "violent game kill cheat", True, "violence", 67),
        ("Google Meet", "session", "Online Math Class", False, "safe", 0),
    ]

    for app_name, atype, content, harmful, category, risk in demo_activity:
        ts = datetime.utcnow() - timedelta(hours=random.randint(1, 8))
        log = ActivityLog(
            timestamp=ts,
            application=app_name,
            activity_type=atype,
            content=content,
            is_harmful=harmful,
            category=category,
            risk_score=risk,
        )
        db.session.add(log)

    demo_urls = [
        ("free-coins-now.tk", "phishing", "PHISHING — Known phishing domain", 90, "blocked"),
        ("darkweb-access.xyz", "malicious", "MALICIOUS — Dark web domain", 95, "blocked"),
        ("adult-stream-hd.ru", "malicious", "MALICIOUS — Adult content", 93, "blocked"),
        ("khanacademy.org", "safe", "WHITELISTED — Educational domain", 0, "allowed"),
        ("bit.ly/win-prize123", "suspicious", "SUSPICIOUS — Shortened URL", 55, "flagged"),
    ]

    for url, status, verdict, risk, action in demo_urls:
        ts = datetime.utcnow() - timedelta(hours=random.randint(1, 10))
        entry = URLLog(
            timestamp=ts,
            url=url,
            status=status,
            verdict=verdict,
            risk_level=risk,
            action=action,
            browser="Chrome",
        )
        db.session.add(entry)

    demo_keylogs = [
        ("blue whale challenge task 50", "Chrome", True, "dangerous_challenges", 96.4),
        ("bro try some weed it's cool", "WhatsApp", True, "drugs", 88.3),
        ("how to solve quadratic equations", "Chrome", False, "safe", 3.0),
        ("violent kill enemies cheat codes", "YouTube", True, "violence", 67.2),
        ("what is photosynthesis explain", "Chrome", False, "safe", 2.5),
    ]

    for sentence, app_name, harmful, cat, conf in demo_keylogs:
        ts = datetime.utcnow() - timedelta(hours=random.randint(1, 9))
        entry = KeylogEntry(
            timestamp=ts,
            sentence=sentence,
            application=app_name,
            is_harmful=harmful,
            category=cat,
            confidence=conf,
        )
        db.session.add(entry)

    db.session.commit()
    logger.info("[DB] Demo data seeded ✓")


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/screenshots/<path:filename>")
def serve_screenshot(filename):
    return send_from_directory(SCREENSHOT_DIR, filename)


@app.route("/audio/<path:filename>")
def serve_audio(filename):
    return send_from_directory(AUDIO_DIR, filename)


# ── Dashboard Stats API ────────────────────────────────────────────────────────

@app.route("/api/stats")
def get_stats():
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    total_alerts = Alert.query.count()
    alerts_today = Alert.query.filter(Alert.timestamp >= today).count()
    critical_today = Alert.query.filter(
        Alert.timestamp >= today, Alert.severity == "critical"
    ).count()
    blocked_urls = URLLog.query.filter(URLLog.action == "blocked").count()
    harmful_keylogs = KeylogEntry.query.filter_by(is_harmful=True).count()

    # Risk score calculation
    recent = Alert.query.filter(
        Alert.timestamp >= datetime.utcnow() - timedelta(days=7)
    ).all()
    risk_score = min(100, len(recent) * 10 + critical_today * 15)

    return jsonify({
        "total_alerts": total_alerts,
        "alerts_today": alerts_today,
        "critical_today": critical_today,
        "blocked_urls": blocked_urls,
        "harmful_keylogs": harmful_keylogs,
        "risk_score": risk_score,
        "child_name": os.getenv("CHILD_NAME", "Child"),
    })


@app.route("/api/alerts")
def get_alerts():
    limit = request.args.get("limit", 50, type=int)
    severity = request.args.get("severity", None)
    q = Alert.query.order_by(Alert.timestamp.desc())
    if severity:
        q = q.filter_by(severity=severity)
    alerts = q.limit(limit).all()
    return jsonify([a.to_dict() for a in alerts])


@app.route("/api/activity")
def get_activity():
    limit = request.args.get("limit", 100, type=int)
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(limit).all()
    return jsonify([l.to_dict() for l in logs])


@app.route("/api/urls")
def get_urls():
    limit = request.args.get("limit", 50, type=int)
    logs = URLLog.query.order_by(URLLog.timestamp.desc()).limit(limit).all()
    return jsonify([l.to_dict() for l in logs])


@app.route("/api/keylogs")
def get_keylogs():
    limit = request.args.get("limit", 100, type=int)
    harmful_only = request.args.get("harmful", "false").lower() == "true"
    q = KeylogEntry.query.order_by(KeylogEntry.timestamp.desc())
    if harmful_only:
        q = q.filter_by(is_harmful=True)
    return jsonify([k.to_dict() for k in q.limit(limit).all()])


@app.route("/api/trend")
def get_trend():
    """7-day daily incident counts by category."""
    days = 7
    result = []
    for i in range(days - 1, -1, -1):
        day_start = (datetime.utcnow() - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)
        counts = {
            "date": day_start.strftime("%a"),
            "total": Alert.query.filter(
                Alert.timestamp >= day_start, Alert.timestamp < day_end
            ).count(),
            "drugs": Alert.query.filter(
                Alert.timestamp >= day_start,
                Alert.timestamp < day_end,
                Alert.category == "drugs",
            ).count(),
            "violence": Alert.query.filter(
                Alert.timestamp >= day_start,
                Alert.timestamp < day_end,
                Alert.category == "violence",
            ).count(),
            "phishing": Alert.query.filter(
                Alert.timestamp >= day_start,
                Alert.timestamp < day_end,
                Alert.category == "phishing",
            ).count(),
        }
        result.append(counts)
    return jsonify(result)


@app.route("/api/category-breakdown")
def category_breakdown():
    from sqlalchemy import func
    rows = (
        db.session.query(Alert.category, func.count(Alert.id))
        .group_by(Alert.category)
        .all()
    )
    return jsonify({cat: count for cat, count in rows})


# ── Keylogger Receiver API ─────────────────────────────────────────────────────

@app.route("/api/keylog", methods=["POST"])
def receive_keylog():
    """Receive keylog data from the keylogger agent."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data"}), 400

    entry = KeylogEntry(
        sentence=data.get("sentence", ""),
        application=data.get("application", "unknown"),
        is_harmful=data.get("is_harmful", False),
        category=data.get("category", "safe"),
        confidence=data.get("confidence", 0.0),
    )
    db.session.add(entry)

    # Also add to activity log
    activity = ActivityLog(
        application=data.get("application", "unknown"),
        activity_type="keylog",
        content=data.get("sentence", ""),
        is_harmful=data.get("is_harmful", False),
        category=data.get("category", "safe"),
        risk_score=int(data.get("confidence", 0)),
    )
    db.session.add(activity)
    db.session.commit()

    # Broadcast to dashboard via WebSocket
    socketio.emit("new_keylog", entry.to_dict())

    return jsonify({"status": "ok", "id": entry.id})


@app.route("/api/alert", methods=["POST"])
def receive_alert():
    """Receive alert data from the keylogger agent."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data"}), 400

    alert = Alert(
        content=data.get("content", ""),
        category=data.get("category", "unknown"),
        severity=data.get("severity", "medium"),
        confidence=data.get("confidence", 0.0),
        application=data.get("application", "unknown"),
        screenshot_path=data.get("screenshot_path"),
        audio_path=data.get("audio_path"),
        email_sent=False,
        action_taken="alert_sent",
        child_name=os.getenv("CHILD_NAME", "Child"),
    )
    db.session.add(alert)
    db.session.commit()

    alert_dict = alert.to_dict()

    # Broadcast to all connected dashboard clients
    socketio.emit("new_alert", alert_dict)
    logger.info(f"[ALERT RECEIVED] {alert.category} — {alert.content[:60]}")

    return jsonify({"status": "ok", "id": alert.id})


# ── ML Analyze API ─────────────────────────────────────────────────────────────

@app.route("/api/analyze", methods=["POST"])
def analyze_text():
    """Analyze a piece of text with the ML model."""
    data = request.get_json()
    text = (data or {}).get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400

    result = detector.analyze(text)

    # Log the analysis
    entry = KeylogEntry(
        sentence=text,
        application="manual-analysis",
        is_harmful=result["is_harmful"],
        category=result["category"],
        confidence=result["confidence"],
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify(result)


# ── URL Check API ──────────────────────────────────────────────────────────────

@app.route("/api/check-url", methods=["POST"])
def check_url():
    """Check a URL for phishing/malicious content."""
    data = request.get_json()
    url = (data or {}).get("url", "").strip()
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    result = url_checker.check(url)

    log = URLLog(
        url=url,
        status=result["status"],
        verdict=result["verdict"],
        risk_level=result["risk_level"],
        action=result["action"],
        browser="manual",
    )
    db.session.add(log)
    db.session.commit()

    socketio.emit("new_url_check", {**result, "id": log.id})
    return jsonify(result)


# ── Settings API ───────────────────────────────────────────────────────────────

@app.route("/api/settings", methods=["GET"])
def get_settings():
    return jsonify({
        "child_name": os.getenv("CHILD_NAME", "Child"),
        "parent_email": os.getenv("PARENT_EMAIL", ""),
        "ml_threshold": float(os.getenv("ML_THRESHOLD", "0.50")),
        "enable_screenshot": os.getenv("ENABLE_SCREENSHOT", "True") == "True",
        "enable_audio": os.getenv("ENABLE_AUDIO_RECORD", "True") == "True",
        "audio_duration": int(os.getenv("AUDIO_DURATION_SECONDS", "30")),
        "keylog_interval": int(os.getenv("KEYLOG_REPORT_INTERVAL", "60")),
    })


@app.route("/api/settings", methods=["POST"])
def save_settings():
    data = request.get_json() or {}
    # In production these would write to .env or a config DB
    # For demo, just echo back success
    return jsonify({"status": "saved", "settings": data})


@app.route("/api/test-email", methods=["POST"])
def test_email():
    """Send a test email to verify configuration."""
    ok = email_service.send_alert(
        subject="Test Alert from SafeGuard AI",
        content="This is a test email to verify your SafeGuard AI alert configuration.",
        category="test",
        severity="low",
        confidence=100.0,
    )
    return jsonify({"status": "sent" if ok else "failed"})


@app.route("/api/anti-keylogger/scan", methods=["GET"])
def scan_processes():
    """Scan for suspicious keylogger processes."""
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from keylogger.keylogger import AntiKeyloggerScanner
        scanner = AntiKeyloggerScanner()
        results = scanner.scan()
        return jsonify({"suspicious": results, "count": len(results)})
    except Exception as e:
        return jsonify({"suspicious": [], "count": 0, "error": str(e)})


# ── WebSocket Events ───────────────────────────────────────────────────────────

@socketio.on("connect")
def handle_connect():
    logger.info(f"[WS] Client connected: {request.sid}")
    emit("connected", {"status": "connected", "server": "SafeGuard AI"})


@socketio.on("disconnect")
def handle_disconnect():
    logger.info(f"[WS] Client disconnected: {request.sid}")


@socketio.on("request_stats")
def handle_stats_request():
    with app.app_context():
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        alerts_today = Alert.query.filter(Alert.timestamp >= today).count()
        critical_today = Alert.query.filter(
            Alert.timestamp >= today, Alert.severity == "critical"
        ).count()
        emit("stats_update", {
            "alerts_today": alerts_today,
            "critical_today": critical_today,
        })


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_demo_data()

    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"

    logger.info(f"")
    logger.info(f"  ╔══════════════════════════════════════╗")
    logger.info(f"  ║     SafeGuard AI — Backend Server    ║")
    logger.info(f"  ║  Dashboard: http://localhost:{port}      ║")
    logger.info(f"  ╚══════════════════════════════════════╝")
    logger.info(f"")

    socketio.run(app, host="0.0.0.0", port=port, debug=debug)
