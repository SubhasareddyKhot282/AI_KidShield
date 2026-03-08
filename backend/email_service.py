"""
backend/email_service.py
━━━━━━━━━━━━━━━━━━━━━━━━
SafeGuard AI — Email Alert Service
Sends parent alert emails with screenshot & audio attachments.
"""

import smtplib
import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime

logger = logging.getLogger(__name__)


class EmailAlertService:
    def __init__(self):
        self.email_address = os.getenv("EMAIL_ADDRESS", "")
        self.email_password = os.getenv("EMAIL_APP_PASSWORD", "")
        self.parent_email = os.getenv("PARENT_EMAIL", "")
        self.child_name = os.getenv("CHILD_NAME", "Child")

    def send_alert(
        self,
        subject: str,
        content: str,
        category: str,
        severity: str,
        confidence: float,
        screenshot_path: str = None,
        audio_path: str = None,
    ) -> bool:
        """
        Send an alert email to the parent with optional attachments.
        Returns True if sent successfully.
        """
        if not self.email_address or not self.email_password or not self.parent_email:
            logger.warning("[EMAIL] Email credentials not configured. Skipping alert.")
            return False

        try:
            msg = MIMEMultipart()
            msg["Subject"] = f"🚨 SafeGuard AI Alert [{severity.upper()}]: {subject}"
            msg["From"] = self.email_address
            msg["To"] = self.parent_email

            body = self._build_email_body(
                content, category, severity, confidence
            )
            msg.attach(MIMEText(body, "html"))

            # Attach screenshot
            if screenshot_path and os.path.exists(screenshot_path):
                self._attach_file(msg, screenshot_path, "screenshot.png")

            # Attach audio
            if audio_path and os.path.exists(audio_path):
                self._attach_file(msg, audio_path, "audio_evidence.wav")

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(self.email_address, self.email_password)
                server.send_message(msg)

            logger.info(f"[EMAIL] Alert sent to {self.parent_email} ✓")
            return True

        except Exception as e:
            logger.error(f"[EMAIL ERROR] {e}")
            return False

    def _attach_file(self, msg: MIMEMultipart, file_path: str, filename: str):
        try:
            with open(file_path, "rb") as f:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f"attachment; filename={filename}",
                )
                msg.attach(part)
        except Exception as e:
            logger.error(f"[EMAIL ATTACH] Failed to attach {file_path}: {e}")

    def _build_email_body(
        self, content: str, category: str, severity: str, confidence: float
    ) -> str:
        severity_colors = {
            "critical": "#ef4444",
            "high": "#f59e0b",
            "medium": "#a855f7",
            "low": "#22d3a0",
        }
        color = severity_colors.get(severity, "#6b84a8")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return f"""
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    <div style="background:{color};padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">🛡️ SafeGuard AI Alert</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">Child Online Safety System</p>
    </div>
    <div style="padding:28px;">
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin-bottom:20px;">
        <strong>⚠️ SEVERITY: {severity.upper()}</strong><br/>
        Harmful content was detected on <strong>{self.child_name}</strong>'s device.
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px;background:#f8f9fa;font-weight:bold;border-radius:4px;width:140px;">📅 Time</td>
            <td style="padding:10px;">{timestamp}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">📂 Category</td>
            <td style="padding:10px;color:{color};font-weight:bold;">{category.replace('_', ' ').title()}</td></tr>
        <tr><td style="padding:10px;background:#f8f9fa;font-weight:bold;">🧠 ML Confidence</td>
            <td style="padding:10px;">{confidence:.1f}%</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">💬 Detected Content</td>
            <td style="padding:10px;font-family:monospace;background:#fff5f5;border-radius:4px;color:#dc3545;">{content[:300]}</td></tr>
      </table>
      <div style="margin-top:24px;padding:16px;background:#e8f4fd;border-radius:8px;">
        <strong>📌 Actions Taken:</strong><br/>
        ✅ Screenshot captured and attached<br/>
        ✅ Audio recording attached (if enabled)<br/>
        ✅ Activity logged to dashboard<br/>
        ✅ This email notification sent
      </div>
      <p style="margin-top:24px;color:#6c757d;font-size:13px;text-align:center;">
        Login to the <strong>SafeGuard AI Dashboard</strong> at <a href="http://localhost:5000">http://localhost:5000</a>
        to view the full incident report.
      </p>
    </div>
    <div style="background:#333;padding:14px;text-align:center;color:#aaa;font-size:12px;">
      SafeGuard AI — Child Protection Monitoring System
    </div>
  </div>
</body>
</html>
"""
