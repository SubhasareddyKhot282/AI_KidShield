# 🛡️ SafeGuard AI — Child Protection Monitoring System

A complete capstone project combining **Cybersecurity**, **Machine Learning**, and **Web Development**
to create a smart parental control and online safety system.

---

## 📁 Project Structure

```
safeguard/
├── run.py                        ← Main launcher (starts Flask server)
├── requirements.txt              ← All Python dependencies
├── .env.example                  ← Copy to .env and configure
│
├── backend/
│   ├── app.py                    ← Flask REST API + WebSocket server
│   └── email_service.py          ← Gmail alert email sender
│
├── keylogger/
│   ├── keylogger.py              ← Keylogger agent (runs on child's device)
│   ├── signatures.txt            ← Known keylogger process signatures
│   └── whitelist.txt             ← Whitelisted safe processes
│
├── ml_model/
│   └── offensive_model.py        ← ML content detector (RoBERTa + keyword fallback)
│
├── database/
│   └── models.py                 ← SQLAlchemy DB models (SQLite)
│
└── frontend/
    └── index.html                ← Parent dashboard (HTML + JS + WebSocket)
```

---

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Gmail credentials and parent email
```

**Required `.env` values:**
```
EMAIL_ADDRESS=your_gmail@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   # Gmail App Password (not regular password)
PARENT_EMAIL=parent@gmail.com
CHILD_NAME=Aarav
```

> **Get Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords

### 3. Start the Dashboard Server
```bash
python run.py
```
Open: **http://localhost:5000**

### 4. Start the Keylogger Agent (on child's device)
```bash
python keylogger/keylogger.py
```

---

## 🚀 Features

### 🧠 Machine Learning
- **Primary Model:** `cardiffnlp/twitter-roberta-base-offensive` (HuggingFace)
- **Fallback:** Keyword-based detection (works without GPU)
- Detects: drugs, dangerous challenges, violence, abusive language, adult content, phishing

### ⌨️ Keylogger Agent
- Captures every sentence typed across all applications
- Runs ML analysis on each Enter keypress
- Sends email alert + screenshot + audio on detection
- Reports to Flask dashboard via REST API

### 🔗 URL / Phishing Detection
- Malicious TLD detection (`.tk`, `.ml`, `.xyz`, `.onion`)
- Phishing pattern matching
- Shortened URL flagging
- Whitelist for trusted educational sites

### 📸 Evidence Capture
- Auto screenshot on threat detection (PIL ImageGrab)
- 30-second audio recording on critical alerts (sounddevice)
- Stored and viewable in dashboard

### 📧 Email Alerts
- HTML-formatted alert emails with evidence attachments
- Screenshot and audio attached to email
- Sent via Gmail SMTP SSL

### 📊 Parent Dashboard
- Real-time WebSocket updates (Flask-SocketIO)
- 7-day trend charts (Canvas API)
- Alert center with severity filtering
- ML text analyzer (calls backend API)
- URL phishing checker
- Activity log from SQLite database
- Risk score gauge
- Anti-keylogger scanner

### 🛡️ Anti-Keylogger Protection
- Scans running processes for known keylogger signatures
- Can terminate suspicious processes
- Whitelist for legitimate processes

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/alerts` | Alert history |
| GET | `/api/keylogs` | Keylog entries |
| GET | `/api/urls` | URL scan history |
| GET | `/api/activity` | Activity log |
| GET | `/api/trend` | 7-day incident trend |
| GET | `/api/category-breakdown` | Alerts by category |
| POST | `/api/keylog` | Receive keylog from agent |
| POST | `/api/alert` | Receive alert from agent |
| POST | `/api/analyze` | ML text analysis |
| POST | `/api/check-url` | URL phishing check |
| GET | `/api/settings` | Get settings |
| POST | `/api/settings` | Save settings |
| POST | `/api/test-email` | Send test email |
| GET | `/api/anti-keylogger/scan` | Scan for keyloggers |

## 🔄 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `new_alert` | Server → Client | Real-time alert notification |
| `new_keylog` | Server → Client | Real-time keylog update |
| `new_url_check` | Server → Client | URL check result |
| `request_stats` | Client → Server | Request stats update |

---

## 🛠️ Tech Stack

- **Backend:** Python 3.11+, Flask, Flask-SocketIO, Flask-SQLAlchemy
- **ML:** HuggingFace Transformers, PyTorch (RoBERTa), Scikit-learn
- **Monitoring:** pynput (keylogger), psutil (process scanner), PIL (screenshots), sounddevice (audio)
- **Database:** SQLite (via SQLAlchemy)
- **Frontend:** Vanilla HTML/CSS/JavaScript, Socket.IO client, Canvas API
- **Email:** smtplib (Gmail SMTP SSL)

---

## ⚠️ Ethical Notice

This system is designed for **parental monitoring of minor children** with appropriate consent and 
legal compliance. Always ensure compliance with local privacy laws before deploying.
