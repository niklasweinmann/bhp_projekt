from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request
import pandas as pd
import os
import traceback

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
