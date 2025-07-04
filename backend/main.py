from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request
from fastapi.responses import FileResponse
import pandas as pd
import os
import traceback
import json
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import Optional
from fastapi import status
from fastapi.security import OAuth2PasswordBearer
from fastapi import Header
from fastapi import Body

app = FastAPI()

# CORS für das Frontend erlauben
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CSV-Pfad
CSV_PATH = os.path.join(os.path.dirname(__file__), '../data/arten_naehrwerte.csv')
DESIGN_DIR = os.path.join(os.path.dirname(__file__), '../data/designs')
os.makedirs(DESIGN_DIR, exist_ok=True)

USERS_PATH = os.path.join(os.path.dirname(__file__), '../data/users.json')
SECRET_KEY = "supersecretkey"  # Für Produktion sicher speichern!
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def load_users():
    if not os.path.exists(USERS_PATH):
        return []
    with open(USERS_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_users(users):
    with open(USERS_PATH, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def get_user(username: str):
    users = load_users()
    for user in users:
        if user['username'] == username:
            return user
    return None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# Registrierung
@app.post("/api/register")
def register(form: OAuth2PasswordRequestForm = Depends()):
    users = load_users()
    if get_user(form.username):
        raise HTTPException(status_code=400, detail="Benutzer existiert bereits")
    hashed = get_password_hash(form.password)
    users.append({"username": form.username, "hashed_password": hashed})
    save_users(users)
    return {"msg": "Registrierung erfolgreich"}

# Login
@app.post("/api/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form.username)
    if not user or not verify_password(form.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Falscher Benutzername oder Passwort")
    token = create_access_token({"sub": user['username']})
    return {"access_token": token, "token_type": "bearer"}

# User-Info
@app.get("/api/me")
def me(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token ungültig")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token ungültig")
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    return {"username": user['username']}

@app.get("/api/plants")
def get_plants():
    try:
        df = pd.read_csv(CSV_PATH, sep=';')
        # Nur ID und deutsche Bezeichnung zurückgeben
        return df[['ID', 'deutsche Bezeichnung']].dropna(subset=['ID', 'deutsche Bezeichnung']).to_dict(orient="records")
    except Exception as e:
        print('Fehler beim Laden der Pflanzen:', e)
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

# Hilfsfunktion: User aus Token extrahieren
from jose import JWTError

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token ungültig")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token ungültig")
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    return user

@app.post("/api/designs")
def save_design(request: Request, user=Depends(get_current_user)):
    data = request.json()
    name = data.get('name', 'default')
    user_dir = os.path.join(DESIGN_DIR, user['username'])
    os.makedirs(user_dir, exist_ok=True)
    with open(os.path.join(user_dir, f"{name}.json"), 'w', encoding='utf-8') as f:
        json.dump(data.get('design', {}), f)
    return {"status": "ok"}

@app.get("/api/designs/{name}")
def load_design(name: str, user=Depends(get_current_user)):
    user_dir = os.path.join(DESIGN_DIR, user['username'])
    path = os.path.join(user_dir, f"{name}.json")
    if not os.path.exists(path):
        return {"error": "not found"}
    return FileResponse(path, media_type='application/json')

@app.get("/api/designs")
def list_designs(user=Depends(get_current_user)):
    user_dir = os.path.join(DESIGN_DIR, user['username'])
    if not os.path.exists(user_dir):
        return {"designs": []}
    files = [f[:-5] for f in os.listdir(user_dir) if f.endswith('.json')]
    return {"designs": files}
