# Setup guide

## Layout

```
cyberclash/
├─ docker-compose.yml
├─ .env                 (not in git)
├─ .env.example
├─ backend/
│  ├─ .venv/            (not in git)
│  ├─ requirements.txt
│  ├─ Dockerfile
│  ├─ content/          night1_challenges.json, lessons.json
│  ├─ tools/validate_content.py
│  └─ app/              main.py db.py content.py models.py ai.py tools.py seed.py
└─ frontend/
   ├─ Dockerfile
   ├─ vite.config.ts
   └─ src/              balance.ts store/ api/ screens/ components/
```

## 1. Frontend

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install && npm install zustand @tanstack/react-query
```

`vite.config.ts` needs a proxy so the browser calls `/api` on the same address:

```ts
server: { host: true, port: 5173,
  proxy: { "/api": { target: process.env.API_URL ?? "http://localhost:8000", changeOrigin: true } } }
```

## 2. Backend (venv)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

`requirements.txt` (pin exact versions after your first install with `pip freeze`):

```
fastapi
uvicorn[standard]
openai
langchain
langchain-openai
python-dotenv
pytest
```

Run without Docker: `uvicorn app.main:app --reload --port 8000`.

## 3. Secrets

`.env.example` (copy to `.env`, never commit `.env`):

```
OPENAI_API_KEY=
OPENAI_MODEL=
AI_TIMEOUT_SECONDS=12
```

## 4. Docker Compose

```yaml
services:
  backend:
    build: ./backend
    env_file: .env
    ports: ["8000:8000"]
    volumes: ["./backend:/app"]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    environment: ["API_URL=http://backend:8000"]
    volumes: ["./frontend:/app", "/app/node_modules"]
    depends_on: [backend]
```

Backend Dockerfile: `FROM python:3.12-slim`, copy `requirements.txt`, `pip install -r`, copy the rest. Frontend Dockerfile: `FROM node:22`, `npm install`, `CMD ["npm","run","dev"]`.

```bash
docker compose up --build        # start
docker compose down              # stop
```

## 5. Verify

```bash
curl http://localhost:5173/api/health
# {"status":"ok","ai_available":true}
```
If that works through port 5173, the proxy, backend and Docker are all wired correctly.

## .gitignore

`.env`, `backend/.venv`, `node_modules`, `*.db`, `__pycache__`.
