# 🐳 Docker Deployment für Coolify

## Schnellstart

### 1. Repository in Coolify hinzufügen
- Neues Projekt erstellen
- "Docker Compose" als Deployment-Typ wählen
- Repository URL angeben

### 2. Compose File auswählen
- **Mit Datenbank:** `docker-compose.yml`
- **Ohne Datenbank:** `docker-compose.simple.yml`

### 3. Environment Variables in Coolify setzen

```env
# Ports
FRONTEND_PORT=80
BACKEND_PORT=8000

# Backend URL (deine Domain)
REACT_APP_BACKEND_URL=https://deine-domain.de

# Falls PostgreSQL verwendet wird:
POSTGRES_USER=admin
POSTGRES_PASSWORD=SICHERES_PASSWORT_HIER
POSTGRES_DB=oeh_wirtschaft
DB_PORT=5432
```

---

## Dateistruktur

```
/app
├── docker-compose.yml          # Mit PostgreSQL
├── docker-compose.simple.yml   # Ohne Datenbank
├── .env.example                # Beispiel Environment
├── frontend/
│   ├── Dockerfile              # React Build + Nginx
│   ├── nginx.conf              # Nginx Config mit API Proxy
│   └── .dockerignore
└── backend/
    ├── Dockerfile              # FastAPI
    └── .dockerignore
```

---

## Lokales Testen

```bash
# Mit Datenbank
docker-compose up --build

# Ohne Datenbank
docker-compose -f docker-compose.simple.yml up --build
```

---

## Ports

| Service   | Interner Port | Standard Externer Port |
|-----------|---------------|------------------------|
| Frontend  | 80            | 80                     |
| Backend   | 8000          | 8000                   |
| PostgreSQL| 5432          | 5432                   |

---

## Wichtige Hinweise

1. **REACT_APP_BACKEND_URL**: In Production auf deine echte Domain setzen
2. **POSTGRES_PASSWORD**: Unbedingt ändern!
3. **SSL**: Wird von Coolify automatisch gehandhabt
4. Das Frontend proxied alle `/api` Anfragen automatisch zum Backend

---

## Asset-Synchronisation (Bilder)

Alle Bilder aus `frontend/public/images/` werden automatisch beim Backend-Start in die PostgreSQL-Datenbank geladen:

- **Neue Bilder**: Werden automatisch eingefügt
- **Geänderte Bilder**: Werden anhand des File-Hashes erkannt und aktualisiert
- **Volume Mount**: Die Docker-Compose bindet das Images-Verzeichnis automatisch ein

```yaml
# Wird automatisch durch docker-compose.yml konfiguriert:
volumes:
  - ./frontend/public/images:/app/images:ro
environment:
  IMAGES_PATH: /app/images
```

**Bilder austauschen:**
1. Bild in `frontend/public/images/` ersetzen
2. Container neu starten: `docker-compose restart backend`
3. Das neue Bild wird automatisch in die DB synchronisiert
