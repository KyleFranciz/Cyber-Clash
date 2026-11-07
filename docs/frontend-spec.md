# Frontend spec

React + TypeScript + Vite. Zustand holds game state. TanStack Query talks to the server. No router: one `screen` value decides what shows.

## Stage

Draw everything on a fixed **1440×900** stage and scale it to the window with a CSS transform (`scale = min(w/1440, h/900)`), centered. All positions in `assets-guide.md` are on this stage.

## Screens

`title` → `office` (inbox on the desk, email modal opens on top) → `results`. Other screens (camera, encounter, blackout) are "next/later".

## Store (`store/game.ts`)

```ts
screen: "title" | "office" | "results";
modal: null | { challengeId: string };
mode: Mode;
runId: string;                 // crypto.randomUUID() at start of night
queue: PublicChallenge[];      // emails still to arrive
current: PublicChallenge[];    // emails in the inbox
results: AnswerResult[];
integrity: number; power: number; clock: number;   // clock = game minutes 0..360
activeThreats: { challengeId: string; since: number }[];
tick(dt: number): void;        // the only place time passes
```

## The game loop

One `requestAnimationFrame` loop calls `tick(dt)`. Pause the clock and drains while a modal is open (proposed).

## Balance (`balance.ts`, proposals, guided / standard / challenge)

| Setting | Value |
|---|---|
| Night length (real minutes) | 7 / 10 / 10 |
| AI hint cost (power) | 3 / 6 / 10 |
| Starting power | 100 / 85 / 70 |
| Full on phishing | +5 integrity (cap 100) |
| Reduced on phishing | the threat drains 1 integrity per 15 game-minutes |
| Reduced on legit | −3 power |
| Arrival schedule | first 3 emails at start, then one at 1:00, 2:00, 3:00 AM |

All of these are tunable. Change only this file.

## Server calls (TanStack Query)

`useChallenges`, `useHint`, `useAnswer`, `useExplain`, `useChat`. Wrap `fetch` in `api/client.ts`. Use mutations for hint, answer, explain and chat; a query for challenges.

## Highlighting clues

After the answer, clues carry exact `start`/`end` offsets into a field. `splitByClues(text, clues)` returns an ordered list of `{text, clue?}` pieces. Render a clue piece with a color **and** a small number marker, so color is never the only signal.

```ts
function splitByClues(text: string, clues: Clue[]) {
  const sorted = [...clues].sort((a, b) => a.start - b.start);
  const out: { text: string; clue?: Clue }[] = [];
  let pos = 0;
  for (const c of sorted) {
    if (c.start < pos) continue;            // skip overlaps
    if (c.start > pos) out.push({ text: text.slice(pos, c.start) });
    out.push({ text: text.slice(c.start, c.end), clue: c });
    pos = c.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}
```

## Components

`Stage`, `Desk` (inbox), `EmailModal`, `ActionButton` (three: Leave it / Verify separately / Report phishing), `HighlightedText`, `FeedbackCard`, `AiMessage` (spinner, then text with citation chips and sources), `Spinner`, `StatBar`, `Results`.

## Behavior rules

- Show the free `hint_basic` always. The AI hint costs power and may be wrong; show its stated confidence.
- After the answer, show feedback and highlights. If `explain_recommended`, call `/explain` and show a spinner; on `fallback`, keep the authored feedback and show nothing else.
- Show a small "draft" label next to any source with `checked: false`.
- Never show an error screen for AI problems.
- Keyboard: buttons are real `<button>`s, modal traps focus, Escape does nothing during a decision.
