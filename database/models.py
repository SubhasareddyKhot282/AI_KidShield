"""
database/models.py
━━━━━━━━━━━━━━━━━━
SafeGuard AI — SQLAlchemy Database Models
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False, default="unknown")
    severity = db.Column(db.String(20), nullable=False, default="medium")
    confidence = db.Column(db.Float, default=0.0)
    application = db.Column(db.String(100), default="unknown")
    screenshot_path = db.Column(db.String(255), nullable=True)
    audio_path = db.Column(db.String(255), nullable=True)
    email_sent = db.Column(db.Boolean, default=False)
    action_taken = db.Column(db.String(50), default="logged")
    child_name = db.Column(db.String(100), default="Child")

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "content": self.content,
            "category": self.category,
            "severity": self.severity,
            "confidence": self.confidence,
            "application": self.application,
            "screenshot_path": self.screenshot_path,
            "audio_path": self.audio_path,
            "email_sent": self.email_sent,
            "action_taken": self.action_taken,
            "child_name": self.child_name,
        }


class ActivityLog(db.Model):
    __tablename__ = "activity_logs"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    application = db.Column(db.String(100), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # search, url, message
    content = db.Column(db.Text, nullable=False)
    is_harmful = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50), default="safe")
    risk_score = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "application": self.application,
            "activity_type": self.activity_type,
            "content": self.content,
            "is_harmful": self.is_harmful,
            "category": self.category,
            "risk_score": self.risk_score,
        }


class URLLog(db.Model):
    __tablename__ = "url_logs"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    url = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), nullable=False)  # safe, phishing, malicious, etc
    verdict = db.Column(db.Text, nullable=True)
    risk_level = db.Column(db.Integer, default=0)
    action = db.Column(db.String(20), default="logged")
    browser = db.Column(db.String(50), default="unknown")

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "url": self.url,
            "status": self.status,
            "verdict": self.verdict,
            "risk_level": self.risk_level,
            "action": self.action,
            "browser": self.browser,
        }


class KeylogEntry(db.Model):
    __tablename__ = "keylog_entries"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    sentence = db.Column(db.Text, nullable=False)
    application = db.Column(db.String(100), default="unknown")
    is_harmful = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50), default="safe")
    confidence = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "sentence": self.sentence,
            "application": self.application,
            "is_harmful": self.is_harmful,
            "category": self.category,
            "confidence": self.confidence,
        }
