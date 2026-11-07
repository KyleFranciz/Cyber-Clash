# Content guide

Content lives in `backend/content/`. Follow `GameDesign1/content_schema.md` and run `tools/validate_content.py` after every edit.

## Rules

- Fictional `.example` domains only. The company is Brightfield: `brightfield.example`.
- 30–50% of challenges are legitimate. Legitimate mail can be urgent.
- Every challenge has a `full` and a `reduced` outcome for each action. Never "none".
- 2 sources per challenge. Review status: draft → sme_reviewed → approved.
- Clues use exact character spans and a kind: `red_flag`, `legit_signal`, `benign_oddity`.
- Each challenge has a free basic hint and an authored AI hint with a stated confidence and `ai_is_correct`.

## Night 1 challenges

| ID | Email | Type | Tier | Brief |
|---|---|---|---|---|
| N1-EM-001 | IT Helpdesk: password expires in 1 hour | Phishing | 1 | **Written.** Lookalike sender `brightfie1d-support.example`, link mismatch. |
| N1-EM-002 | Facilities: badge reader maintenance | Legitimate | 2 | **Written.** |
| N1-EM-003 | Payroll: updated direct deposit form | Phishing | 2 | Sender looks right but reply-to differs; link mismatch; asks for bank details. |
| N1-EM-004 | DocuShare: shared document | Legitimate | 2 | Link matches, internal domain, expected context. |
| N1-EM-005 | Unknown vendor invoice | Phishing | 1 | Attachment `Invoice_20931.pdf.exe`, urgency, generic greeting, unknown sender. |
| N1-EM-006 | Dana: lunch | Legitimate | 1 | Plain note from a coworker. A benign oddity is fine (a typo). |

## Lesson passages (6–10 in `lessons.json`)

Write each in your **own words** from the cited page. Never paste. Keep each to 2–3 sentences. All sources start as `"checked": false` until a person compares the passage with the page.

| ID | Topic | Tags |
|---|---|---|
| P1 | Lookalike domains | lookalike-domain |
| P2 | Urgency and pressure | urgency |
| P3 | Link text vs real destination | link-mismatch |
| P4 | Requests for credentials or bank details | credential-request |
| P5 | Unexpected attachments, double extensions | attachment |
| P6 | Reply-to differs from sender | reply-to-mismatch |
| P7 | Verify through a separate channel | verify-separately |
| P8 | How and why to report | report |
| P9 | Legitimate mail can be urgent too | legit-urgent |

Passages are general lessons, not answers for a specific email, so they are safe before the player answers.

Format example:

```json
{ "id": "P1", "objective_ids": ["LO1"], "tags": ["lookalike-domain"],
  "text": "...", "source_id": "S1" }
```
