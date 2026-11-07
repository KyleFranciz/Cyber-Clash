# API contract

All routes are under `/api`. JSON in, JSON out. The frontend and backend both follow this file exactly.

## Types

```ts
type Action  = "report" | "verify_separately" | "no_action";
type Outcome = "full" | "reduced";            // never "none"
type Mode    = "guided" | "standard" | "challenge";

type Source = {
  id: string; title: string; publisher: string; url: string;
  checked: boolean;                           // false => show a "draft" label
  passage_ids: string[];
};

type PublicChallenge = {
  id: string; tier: 1 | 2 | 3;
  email: {
    from_name: string; from_address: string; reply_to: string | null;
    subject: string; body: string;
    links: { display_text: string; actual_url: string }[];
    attachments: string[];
  };
  hint_basic: string;                         // free hint
};

type AIReply = { text: string | null; sources: Source[]; fallback: boolean };
```

`PublicChallenge` is the **only** shape sent before the player answers. It never includes `is_malicious`, `best_action`, outcomes, feedback, clues or the AI hint.

## Endpoints

### GET /api/health
Returns `{ "status": "ok", "ai_available": boolean }`.

### GET /api/challenges?night=1&mode=standard&count=6&seed=
Returns `{ "night": 1, "mode": "standard", "challenges": PublicChallenge[] }`.

Draw rule: tiers allowed per night: N1 1–2, N2 1–2, N3 2, N4 2–3, N5 2–3. Guided caps the top tier at 2. Challenge floors the bottom tier at 2. No repeats. A `seed` gives a repeatable order.

### GET /api/challenges/{id}
Returns one `PublicChallenge` or 404.

### POST /api/hint
Body: `{ "run_id"?: string, "challenge_id": string }`
Returns `{ "text": string, "stated_confidence": number }`. This is the authored AI hint. It may be wrong on purpose. The frontend charges the hint cost.

### POST /api/answer
Body: `{ "run_id": string, "challenge_id": string, "action": Action, "hint_used": boolean }`

Returns:
```ts
{
  challenge_id: string;
  outcome: Outcome;
  is_best: boolean;
  acceptable: boolean;
  is_malicious: boolean;
  best_action: Action;
  feedback: string;
  clues: { id: string; kind: "red_flag" | "legit_signal" | "benign_oddity";
           field: string; start: number; end: number; text: string; why: string }[];
  objectives: { id: string; title: string }[];
  explain_recommended: boolean;      // true when outcome is "reduced"
}
```
This is the first time secret fields leave the server. The server stores an attempt row (`run_id`, `challenge_id`).

### POST /api/explain
Body: `{ "run_id": string, "challenge_id": string, "action": Action }`
Returns `AIReply`. Returns **409** if no attempt exists for that `run_id` and `challenge_id`. Cached by `(challenge_id, action)`.

### POST /api/chat
Body: `{ "run_id": string, "challenge_id": string, "history": {role:"user"|"assistant", text:string}[], "question": string }`
Limits: `history` max 6 items, `question` max 500 characters (else 422).
Returns `AIReply`.

The server decides the mode itself: if an attempt exists for `run_id` and `challenge_id`, the chat is **after-answer** (the agent gets `get_challenge_facts`). If not, it is **pre-answer** (no such tool, and the reply must not hint at the answer).

## Errors

| Status | Meaning |
|---|---|
| 404 | Unknown challenge |
| 409 | Explain requested before an answer |
| 422 | Bad body or limits exceeded |
| 200 + `fallback: true` | AI failed or timed out. Not an error. |

## Citation format

The model writes `[P1]`, `[P2]` in its text. The frontend turns each into a small numbered chip and lists `sources` under the message.
