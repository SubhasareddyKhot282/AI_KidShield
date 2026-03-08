"""
run.py — SafeGuard AI Launcher
Starts the Flask backend server. Run the keylogger agent separately on the child's device.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════╗
║            SafeGuard AI — Child Protection System         ║
╠══════════════════════════════════════════════════════════╣
║  1. Starting Flask Backend + Parent Dashboard             ║
║  2. Dashboard: http://localhost:5000                      ║
║                                                          ║
║  To start keylogger agent (on child's device):           ║
║    python keylogger/keylogger.py                          ║
╚══════════════════════════════════════════════════════════╝
    """)
    from backend.app import app, socketio, db, seed_demo_data
    with app.app_context():
        db.create_all()
        seed_demo_data()
    port = int(os.getenv("FLASK_PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=False)
