# Backend für Permakultur-Editor

Dieses Backend stellt eine API bereit, um Pflanzendaten aus der arten.csv bereitzustellen.

## Starten

1. Python-Umgebung aktivieren (optional)
2. Abhängigkeiten installieren:
   ```bash
   pip install fastapi uvicorn pandas
   ```
3. Server starten:
   ```bash
   uvicorn main:app --reload
   ```

## Endpunkte
- `/arten` – Gibt alle Pflanzenarten als JSON zurück
