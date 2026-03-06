# Backend Dockerfile - FastAPI
FROM python:3.11-slim

WORKDIR /app

# System Dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Source kopieren
COPY . .

# Port freigeben
EXPOSE 8000

# Server starten
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
