# Backend spec

Python + FastAPI + SQLite. All routes under `/api`. See `api-contract.md` for shapes.

## Modules (`backend/app/`)

| File | Job |
|---|---|
| `main.py` | FastAPI app, routes, CORS not needed (Vite proxy) |
| `db.py` | SQLite connection and schema |
| `content.py` | Loads packs; builds the public view; picks lesson passages (`get_passages`) |
| `models.py` | Pydantic request/response models |
| `ai.py` | LangChain chain (explain) and agent (chat), prompts, fallback |
| `tools.py` | Agent tools |
| `seed.py` | Validates then loads `content/*.json` into SQLite |

## Schema

```sql
CREATE TABLE challenges (
  id TEXT PRIMARY KEY, pack_id TEXT, night INTEGER, tier INTEGER,
  type TEXT, is_malicious INTEGER, best_action TEXT, data_json TEXT
);
CREATE TABLE learning_objectives (id TEXT PRIMARY KEY, title TEXT);
CREATE TABLE attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT, challenge_id TEXT,
  action TEXT, hint_used INTEGER, outcome TEXT, created_at TEXT
);
CREATE TABLE explanations (challenge_id TEXT, action TEXT, text TEXT,
  PRIMARY KEY (challenge_id, action));
CREATE TABLE lesson_sources (id TEXT PRIMARY KEY, title TEXT, publisher TEXT,
  url TEXT, accessed TEXT, checked INTEGER);
CREATE TABLE lesson_passages (id TEXT PRIMARY KEY, objective_ids TEXT, tags TEXT,
  text TEXT, source_id TEXT);
```

## Public view (allowlist)

Build `PublicChallenge` by **copying named fields**, never by deleting secret ones:

```python
def public_view(row) -> dict:
    d = json.loads(row["data_json"])
    e = d["email"]
    return {
        "id": row["id"], "tier": row["tier"],
        "email": {k: e.get(k) for k in
                  ("from_name","from_address","reply_to","subject","body","links","attachments")},
        "hint_basic": d["hints"]["basic"],
    }
```

## Answering

Look up the action in the challenge's outcomes to get `full` or `reduced`. Insert an `attempts` row. Return the answer shape from the contract. `explain_recommended = (outcome == "reduced")`.

## get_passages (deterministic)

```python
def get_passages(challenge, question=None, limit=4):
    objs = set(challenge["objective_ids"]); tags = set(challenge.get("tags", []))
    scored = []
    for p in all_passages():
        if not objs & set(p["objective_ids"]): continue
        score = len(tags & set(p["tags"]))
        if question:
            score += sum(1 for w in question.lower().split() if w in p["text"].lower())
        scored.append((-score, int(p["id"][1:]), p))
    scored.sort(key=lambda t: (t[0], t[1]))
    return [p for _,_,p in scored[:limit]]
```

Same input, same output, same order.

## Citation filter

```python
CITE = re.compile(r"\[(P\d+)\]")
def filter_citations(text, allowed_ids):
    kept = []
    def repl(m):
        if m.group(1) in allowed_ids:
            kept.append(m.group(1)); return m.group(0)
        return ""
    return CITE.sub(repl, text), kept
```
Then look up each kept passage's source and return `sources` grouped by source with `passage_ids`.

## AI

- **Explain (chain):** prompt = challenge facts + chosen action + clues + passages. One model call, parse to text.
- **Chat (agent):** tools `get_lesson_passages(topic)` always; `get_challenge_facts()` only if an attempt exists. Max 3 tool calls, 12 s timeout, temperature ~0.3, max ~250 tokens.
- On any exception or timeout, return `{text: null, sources: [], fallback: true}`.

### Draft system prompts

Explain: "You are a friendly security coach. In 3–4 short sentences explain what the player missed, using only the clues and passages given. Mark each claim from a passage with its id like [P1]. Never write a URL or name a source."

Chat (after answer): same, plus "Answer the player's question. If no passage fits, say you don't have a source for that."

Chat (before answer): "Help the player think about the email without saying whether it is phishing or what to do. Do not reveal or hint at the answer."

## Environment variables

`OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_TIMEOUT_SECONDS=12`. Load with python-dotenv. If the key is missing, `ai_available` is false and every AI route returns the fallback.

## Tests (pytest)

1. Public view never contains forbidden keys.
2. Answer outcomes match the pack for each action.
3. Draw rules (tiers, no repeats, seed repeatable).
4. Citation filter drops unknown ids.
5. `get_passages` is deterministic.
6. `/explain` without an attempt returns 409.
