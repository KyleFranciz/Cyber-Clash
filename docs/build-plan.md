# Build plan

Deadline about **17:45 ET**. Times assume a start near 14:40. Adjust as you go.

| Time | Goal |
|---|---|
| 14:40–15:10 | **Setup.** Repo, Docker Compose, Vite app, FastAPI `/health`, proxy check works. |
| 15:10–15:55 | **Three tracks in parallel.** A: backend (seed, public view, `/challenges`, `/answer`). B: frontend (stage, store, desk, email modal, three buttons using fake data). C: content (challenges 003–006 and lesson passages). |
| 15:55–16:40 | **Feedback loop.** Connect frontend to the API, highlights, free and AI hints, feedback card. Start the AI explanation chain with fallback. |
| 16:40–17:05 | **Integrate.** Clock, drains, results screen, whole night end to end. |
| 17:05–17:30 | **Chat agent, polish, demo rehearsal.** |
| 17:30–17:45 | **Freeze.** Bug fixes only. Final demo run. |

Solo order: setup → backend answer loop → frontend loop → feedback → results → AI explanation → chat.

## Cut list (cut from the top first)

1. Chat agent (keep the explanation)
2. Pre-answer chat
3. Sound
4. Dark/bright variants
5. Challenge and Guided modes (keep Standard only)

## Definition of done

Play Night 1 start to finish: six emails, three actions, feedback with highlights, results screen. The AI shows an explanation or falls back cleanly.

## Demo checklist (3 minutes)

1. Show the office and the inbox.
2. Open the phishing email, point at the lookalike sender.
3. Use the free hint, then the AI hint, then choose Report.
4. Show the highlighted clues and the explanation with sources.
5. Open a legitimate email and choose Leave it.
6. Make one wrong choice on purpose and show the reduced outcome.
7. Show the results screen.

## Risks

| Risk | Plan |
|---|---|
| Docker trouble | Run without Docker (see setup guide) |
| LangChain version differences | Pin versions, read the docs for that version |
| AI latency | 12 s timeout and authored fallback |
| Invalid content | Run the validator before every seed |
