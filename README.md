# Cyber Clash: Night Shift

A first-person cybersecurity survival-horror game with cards and a timer. You work a night shift in a security office. Emails arrive. For each one you choose: **Leave it**, **Verify separately**, or **Report phishing**. Wrong choices cost you integrity or power. An AI helper explains what you missed, with sources.

**First build (MVP):** the phishing email loop only, Night 1, Standard mode. Everything else is "later".

## Stack

| Part | Choice |
|---|---|
| Frontend | React + TypeScript, Vite, Zustand, TanStack Query |
| Backend | Python, FastAPI, SQLite |
| AI | OpenAI model through LangChain (chain for explanations, agent for chat) |
| Dev setup | Docker Compose, plus a Python venv for the backend |

## AI tools used in development

- Pi Agent
- Claude
- Paper

## Read these in order

1. `docs/game-design.md` – what the game is and why
2. `docs/architecture.md` – how it is built
3. `docs/setup-guide.md` – get everything running
4. `docs/build-plan.md` – what to build and when
5. `docs/api-contract.md` – the exact requests and responses (frontend and backend both follow this)
6. `docs/frontend-spec.md` and `docs/backend-spec.md` – details per side
7. `docs/content-guide.md` – the challenges and lesson passages still to write
8. `docs/assets-guide.md` – the Paper exports and where they go on screen

`AGENTS.md` is for AI coding assistants. Point your assistant at it first.

## Three rules that matter most

1. **Spoiler rule.** Before the player answers, neither the browser nor the AI ever receives `is_malicious`, `best_action`, outcomes, feedback or clues. The server enforces this.
2. **Sources come from the database.** The model writes `[P1]`-style ids. The server attaches the real sources. The model never writes a URL.
3. **The AI is never required.** If it fails, show the authored feedback. Never show an error screen.
