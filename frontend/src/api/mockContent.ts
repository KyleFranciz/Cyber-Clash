import type { Action, Clue, HintReply, Objective, Outcome, PublicChallenge } from "../types";

/**
 * Local stand-in for the Night 1 content pack (docs/content-guide.md,
 * docs/game-design.md section 12), used only when the real backend can't be
 * reached -- see api/client.ts. Nothing here talks to the backend/ directory;
 * that's the team's own work in progress. Fictional domains only (AGENTS.md
 * rule 7), same as the real pack.
 *
 * Each entry carries the private fields a real /api/answer would own
 * (`best_action`, `action_outcome`, `clues`, ...) so api/mock.ts can grade an
 * answer the way the server eventually will, without ever sending those
 * fields to the browser before the player acts -- `toPublicChallenge` below
 * is the same allowlist shape as the real contract.
 */
export type MockChallenge = PublicChallenge & {
  is_malicious: boolean;
  best_action: Action;
  acceptable_actions: Action[];
  action_feedback: Record<Action, string>;
  action_outcome: Record<Action, Outcome>;
  clues: Clue[];
  objectives: Objective[];
  ai_hint: HintReply;
};

export const MOCK_NIGHT1: MockChallenge[] = [
  {
    id: "MOCK-N1-001",
    tier: 1,
    email: {
      from_name: "IT Helpdesk",
      from_address: "helpdesk@brightfie1d-support.example",
      reply_to: null,
      subject: "URGENT: Password expires in 1 hour",
      body:
        "Your Brightfield network password expires in 1 hour. Confirm your password now using the link below to avoid losing access.",
      links: [
        {
          display_text: "https://sso.brightfield.example/reset",
          actual_url: "https://brightfield-sso.example/reset",
        },
      ],
      attachments: [],
    },
    hint_basic: "Look closely at the sender's domain and at where the link really goes.",
    is_malicious: true,
    best_action: "report",
    acceptable_actions: ["report", "verify_separately"],
    action_feedback: {
      report: "Correct. The lookalike domain and the mismatched link both point to phishing.",
      verify_separately: "A safe choice. Confirming through a known channel would have caught this.",
      no_action: "Not clicking protects you, but reporting helps protect everyone else too.",
    },
    action_outcome: { report: "full", verify_separately: "full", no_action: "reduced" },
    clues: [
      {
        id: "C1",
        kind: "red_flag",
        field: "from_address",
        start: "helpdesk@".length,
        end: "helpdesk@brightfie1d-support.example".length,
        text: "brightfie1d-support.example",
        why: "This is not the company's real domain -- the letter l has been swapped for the digit 1.",
      },
      {
        id: "C2",
        kind: "red_flag",
        field: "link",
        start: "https://".length,
        end: "https://brightfield-sso.example".length,
        text: "brightfield-sso.example",
        why: "The link text shows one address, but it actually goes to a different one.",
      },
    ],
    objectives: [
      { id: "LO1", title: "Name at least three evidence-based phishing indicators" },
      { id: "LO2", title: "Choose an appropriate response: report, verify, or take no action" },
    ],
    ai_hint: {
      text: "The sender's domain looks slightly different from the company's usual one. Check it carefully.",
      stated_confidence: 0.9,
    },
  },
  {
    id: "MOCK-N1-002",
    tier: 1,
    email: {
      from_name: "Facilities Team",
      from_address: "facilities@brightfield.example",
      reply_to: null,
      subject: "Scheduled badge reader maintenance tonight",
      body:
        "The badge readers on floors 2 and 3 will be offline from 11 PM to 1 AM tonight for scheduled maintenance. Use the side entrance during this window. No action is needed on your part.",
      links: [],
      attachments: [],
    },
    hint_basic: "Ask what the message wants you to do, and check whether the sender's domain matches the company's.",
    is_malicious: false,
    best_action: "no_action",
    acceptable_actions: ["no_action", "verify_separately"],
    action_feedback: {
      report: "This message looks legitimate: the domain matches and it asks for nothing.",
      verify_separately: "Reasonable if you were unsure, but the clues all point to a genuine notice.",
      no_action: "Correct. The domain matches, nothing is requested, and it's just a heads-up.",
    },
    action_outcome: { report: "reduced", verify_separately: "full", no_action: "full" },
    clues: [
      {
        id: "L1",
        kind: "legit_signal",
        field: "from_address",
        start: "facilities@".length,
        end: "facilities@brightfield.example".length,
        text: "brightfield.example",
        why: "The sender's domain matches the company's real domain.",
      },
      {
        id: "L2",
        kind: "benign_oddity",
        field: "subject",
        start: "Scheduled badge reader maintenance ".length,
        end: "Scheduled badge reader maintenance tonight".length,
        text: "tonight",
        why: "Time-sensitive, but it only gives information -- no pressure to act or hand anything over.",
      },
    ],
    objectives: [
      { id: "LO2", title: "Choose an appropriate response: report, verify, or take no action" },
      { id: "LO3", title: "Recognize that a legitimate message can look urgent" },
    ],
    ai_hint: {
      text: "Nothing here asks you to click or share information, though the timing is worth noting.",
      stated_confidence: 0.7,
    },
  },
  {
    id: "MOCK-N1-003",
    tier: 1,
    email: {
      from_name: "Unknown Vendor",
      from_address: "billing@swiftpay-invoices.example",
      reply_to: null,
      subject: "Invoice attached, please review",
      body:
        "Please see the attached invoice for recent services and confirm payment at your earliest convenience.",
      links: [],
      attachments: ["Invoice_48213.exe"],
    },
    hint_basic: "Do you recognize this vendor, and does the attachment's file type look right for an invoice?",
    is_malicious: true,
    best_action: "report",
    acceptable_actions: ["report", "verify_separately"],
    action_feedback: {
      report: "Correct. An unexpected vendor with an executable attachment is a classic malware pattern.",
      verify_separately: "A safe choice. Checking with accounts payable would have confirmed no such invoice exists.",
      no_action: "Not opening the attachment protects you, but reporting warns everyone else too.",
    },
    action_outcome: { report: "full", verify_separately: "full", no_action: "reduced" },
    clues: [
      {
        id: "C1",
        kind: "red_flag",
        field: "from_name",
        start: 0,
        end: "Unknown Vendor".length,
        text: "Unknown Vendor",
        why: "An unrecognized sender for an unexpected invoice is itself worth a second look.",
      },
      {
        id: "C2",
        kind: "red_flag",
        field: "attachment",
        start: "Invoice_48213".length,
        end: "Invoice_48213.exe".length,
        text: ".exe",
        why: "Invoices are documents, not programs. An .exe attachment can run code on your computer.",
      },
    ],
    objectives: [
      { id: "LO1", title: "Name at least three evidence-based phishing indicators" },
      { id: "LO2", title: "Choose an appropriate response: report, verify, or take no action" },
    ],
    ai_hint: {
      text: "An unfamiliar sender and an executable attachment are both worth treating with suspicion.",
      stated_confidence: 0.85,
    },
  },
  {
    id: "MOCK-N1-004",
    tier: 1,
    email: {
      from_name: "Dana, Accounting",
      from_address: "dana.ortiz@brightfield.example",
      reply_to: null,
      subject: "Lunch on Thursday?",
      body: "Hey, a few of us are grabbing lunch Thursday around noon if you want to join. No pressure either way!",
      links: [],
      attachments: [],
    },
    hint_basic: "Does this message ask you for anything at all?",
    is_malicious: false,
    best_action: "no_action",
    acceptable_actions: ["no_action", "verify_separately"],
    action_feedback: {
      report: "This is an ordinary coworker message with no request -- nothing here to report.",
      verify_separately: "Not necessary here; the domain matches and nothing is being asked of you.",
      no_action: "Correct. A normal internal message with no request and a matching domain.",
    },
    action_outcome: { report: "reduced", verify_separately: "full", no_action: "full" },
    clues: [
      {
        id: "L1",
        kind: "legit_signal",
        field: "from_address",
        start: "dana.ortiz@".length,
        end: "dana.ortiz@brightfield.example".length,
        text: "brightfield.example",
        why: "The sender's domain matches the company's real domain.",
      },
    ],
    objectives: [{ id: "LO3", title: "Recognize that a legitimate message can look urgent" }],
    ai_hint: {
      text: "No request, no link, no attachment, and a matching domain -- low risk.",
      stated_confidence: 0.6,
    },
  },
];
