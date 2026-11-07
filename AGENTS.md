# Instructions for AI coding assistants

You are helping build **Cyber Clash: Night Shift**, a hackathon game. Read `README.md`, then `docs/architecture.md` and `docs/api-contract.md` before writing code.

## Stack (fixed, do not change)

React + TypeScript + Vite, Zustand (one game store), TanStack Query (server calls), plain CSS. No router. Backend: Python + FastAPI + SQLite. AI: OpenAI through LangChain. Docker Compose for dev.

## Hard rules

1. **Never send secret fields to the browser before the player answers.** Forbidden in public responses: `is_malicious`, `best_action`, `outcomes`, `feedback`, `clues`, `ai_hint`. Build the public view from an **allowlist** of fields, not by removing fields.
2. **All AI code lives in the `ai` module** (`ai.py`, `tools.py`). Nothing else imports `openai` or `langchain`.
3. **Never let the model write URLs.** It writes ids like `[P1]`. The server removes any id it was not given, then attaches sources from the database.
4. **AI failure is not an error.** Return `{"text": null, "sources": [], "fallback": true}` and let the UI show authored feedback.
5. **All game numbers live in `frontend/src/balance.ts`.** Never put numbers in content files.
6. **One game loop.** A single `requestAnimationFrame` loop calls `useGame.getState().tick(dt)`. Do not add other timers for game logic.
7. **Fictional domains only** (`.example`). No real brands or real people in content.
8. **Pin LangChain versions.** Check the docs for the installed version before writing agent code. Do not copy old examples.
9. **Validate content before seeding.** `seed.py` runs `tools/validate_content.py` and stops if it fails.
10. **Do not add libraries** (router, vector database, UI kit) without asking.

## Working style

- Make the smallest change that works. The deadline is tight.
- Follow `docs/api-contract.md` exactly. If it must change, change the doc first.
- Explain new concepts in plain words in comments where the code is not obvious. The team wants to understand why, not just what.
- After each change, say how to check it (a command or a click path).

## Done means

The Night 1 loop works end to end: inbox, open email, hint, choose action, feedback with highlighted clues, results screen. The AI explanation is a bonus with a working fallback.
