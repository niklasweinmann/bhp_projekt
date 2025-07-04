import subprocess
import time
import webbrowser
import os
import socket

BACKEND_CMD = ["uvicorn", "main:app", "--reload", "--port", "9000"]
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "backend")
FRONTEND_CMD = ["npm", "run", "dev"]
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")
FRONTEND_URL = "http://localhost:5173/"  # Startseite, leitet automatisch weiter


def wait_for_port(port, host="localhost", timeout=20):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except Exception:
            time.sleep(0.3)
    return False

def start_backend():
    # Beende evtl. laufende uvicorn-Prozesse auf Port 9000
    try:
        import psutil
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            if proc.info['name'] and 'uvicorn' in proc.info['name']:
                if any('--port' in arg and '9000' in arg for arg in proc.info['cmdline']):
                    proc.kill()
    except ImportError:
        pass  # psutil nicht installiert, ignoriere
    # Starte Backend
    return subprocess.Popen(BACKEND_CMD, cwd=BACKEND_DIR)

def start_frontend():
    # Starte Vite-Dev-Server im Frontend-Ordner
    return subprocess.Popen(FRONTEND_CMD, cwd=FRONTEND_DIR)

def open_frontend():
    webbrowser.open(FRONTEND_URL)

def main():
    print("Starte Backend-Server...")
    backend_proc = start_backend()
    print("Starte Frontend-Dev-Server...")
    frontend_proc = start_frontend()
    print("Warte auf Backend-Port 9000...")
    wait_for_port(9000, timeout=20)
    print("Warte auf Frontend-Port 5173...")
    wait_for_port(5173, timeout=30)
    print("Öffne Editor im Browser...")
    open_frontend()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Beende Backend- und Frontend-Server...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
