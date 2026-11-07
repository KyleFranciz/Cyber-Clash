/**
 * Stand-in Night 1 content, used only until the backend's /api/challenges and
 * /api/answer exist. The real source of truth will be
 * backend/content/night1_challenges.json loaded into SQLite -- this file is a
 * development prop so the frontend loop can be played and demoed today, and it
 * is never consulted when a real endpoint answers.
 *
 * The six emails follow the briefs in docs/content-guide.md ("Night 1
 * challenges"). Fictional domains only; the company is brightfield.example
 * (AGENTS.md rule 7). Clue spans are computed with indexOf at module load, so
 * a span can never drift out of sync with the text it points at.
 */

import type {
  Action,
  Clue,
  ClueKind,
  Objective,
  PublicChallenge,
  PublicEmail,
  Source,
} from "../../types";

export const OBJECTIVES: Record<string, Objective> = {
  LO1: { id: "LO1", title: "Name at least three evidence-based phishing indicators" },
  LO2: {
    id: "LO2",
    title: "Choose an appropriate response: report, verify separately, or take no action",
  },
  LO3: {
    id: "LO3",
    title: "Recognize that a legitimate message can look urgent, and that one indicator alone is not proof",
  },
};

/**
 * Lesson sources. `checked: false` is deliberate on S1 -- it exercises the
 * "draft" label the UI must show for an unverified source.
 */
const SOURCE_CISA: Source = {
  id: "S1",
  title: "Recognize and Report Phishing",
  publisher: "CISA",
  url: "https://www.cisa.gov/secure-our-world/recognize-and-report-phishing",
  checked: false,
  passage_ids: ["P1", "P2", "P3", "P8"],
};

const SOURCE_FTC: Source = {
  id: "S2",
  title: "How to Recognize and Avoid Phishing Scams",
  publisher: "FTC",
  url: "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams",
  checked: true,
  passage_ids: ["P4", "P5", "P6", "P7", "P9"],
};

/** A clue before its character offsets have been worked out. */
type ClueSeed = {
  id: string;
  kind: ClueKind;
  field: string;
  /** Exact substring of that field. Must appear verbatim or seeding throws. */
  text: string;
  why: string;
};

export type MockChallenge = {
  public: PublicChallenge;
  is_malicious: boolean;
  best_action: Action;
  acceptable_actions: Action[];
  ai_hint: { text: string; stated_confidence: number; ai_is_correct: boolean };
  /** Authored feedback for each action. Shown instantly, with no AI call. */
  feedback: Record<Action, string>;
  clues: Clue[];
  objective_ids: string[];
  sources: Source[];
  /**
   * Authored stand-in for what the AI explanation chain would write, with
   * [P1]-style citation ids. The real text comes from the server.
   */
  explain: Record<Action, string>;
};

type MockSpec = Omit<MockChallenge, "clues"> & { clue_seeds: ClueSeed[] };

/**
 * The text a clue's offsets index into. "link" resolves to the first link's
 * real destination and "attachment" to the first attachment, because those are
 * the parts a clue actually accuses. See the note on CLUE_FIELDS in
 * src/lib/clues.ts -- the contract never pins this down.
 */
function fieldText(email: PublicEmail, field: string): string | null {
  switch (field) {
    case "from_name":
      return email.from_name;
    case "from_address":
      return email.from_address;
    case "reply_to":
      return email.reply_to;
    case "subject":
      return email.subject;
    case "body":
      return email.body;
    case "link":
      return email.links[0]?.actual_url ?? null;
    case "attachment":
      return email.attachments[0] ?? null;
    default:
      return null;
  }
}

/** Turns seeds into real spans. Throws loudly rather than shipping a bad span. */
function seedClues(email: PublicEmail, seeds: ClueSeed[]): Clue[] {
  return seeds.map((seed) => {
    const haystack = fieldText(email, seed.field);
    if (haystack === null) {
      throw new Error(`[mock] clue ${seed.id} names field "${seed.field}", which this email has no text for`);
    }
    const start = haystack.indexOf(seed.text);
    if (start < 0) {
      throw new Error(`[mock] clue ${seed.id} text "${seed.text}" does not appear in field "${seed.field}"`);
    }
    return {
      id: seed.id,
      kind: seed.kind,
      field: seed.field,
      start,
      end: start + seed.text.length,
      text: seed.text,
      why: seed.why,
    };
  });
}

// ---------------------------------------------------------------------------
// N1-EM-001 -- IT Helpdesk password expiry. Phishing, tier 1.
// ---------------------------------------------------------------------------

const EM001_BODY = `Our records show your Brightfield network password expires in 1 hour. Accounts that are not renewed tonight will be locked out of all systems, including badge access.

To keep your account active, open the renewal page below and confirm your current password, then choose a new one.

Renew now: https://intranet.brightfield.example/password

Brightfield IT Helpdesk
Ticket #88214`;

const EM001: MockSpec = {
  public: {
    id: "N1-EM-001",
    tier: 1,
    email: {
      from_name: "Brightfield IT Helpdesk",
      from_address: "support@brightfie1d-support.example",
      reply_to: null,
      subject: "URGENT: Your password expires in 1 hour",
      body: EM001_BODY,
      links: [
        {
          display_text: "https://intranet.brightfield.example/password",
          actual_url: "http://brightfie1d-support.example/pw-reset.php?u=night",
        },
      ],
      attachments: [],
    },
    hint_basic: "Read the sender's domain one character at a time, then compare where the link really goes.",
  },
  is_malicious: true,
  best_action: "report",
  acceptable_actions: ["report", "verify_separately"],
  ai_hint: {
    text: "The sender's domain is not Brightfield's. I read a 1 where an l belongs, and the renewal link leaves the company's network entirely. I would report this.",
    stated_confidence: 0.92,
    ai_is_correct: true,
  },
  feedback: {
    report:
      "Correct. This is a credential-harvesting message: a lookalike sender domain, manufactured urgency, and a link that leaves Brightfield's network. Reporting it lets the security team block the domain for everyone else.",
    verify_separately:
      "Reasonable. Checking with the helpdesk through a number you already have would have exposed this quickly, and you did not hand over your password. Reporting it as well would have protected your coworkers too.",
    no_action:
      "The message is still sitting in the inbox, and so is the threat. No real IT team asks you to confirm your current password on a web page, and the sender's domain is not Brightfield's.",
  },
  clue_seeds: [
    {
      id: "C1",
      kind: "red_flag",
      field: "from_address",
      text: "brightfie1d-support.example",
      why: "A lookalike domain: the digit 1 stands in for the letter l, and the real company domain is brightfield.example with no suffix.",
    },
    {
      id: "C2",
      kind: "red_flag",
      field: "subject",
      text: "expires in 1 hour",
      why: "Manufactured urgency. A deadline this tight is there to stop you checking anything.",
    },
    {
      id: "C3",
      kind: "red_flag",
      field: "body",
      text: "confirm your current password",
      why: "No legitimate password reset needs your existing password typed into a web page.",
    },
    {
      id: "C4",
      kind: "red_flag",
      field: "link",
      text: "brightfie1d-support.example",
      why: "The link text shows the real intranet address, but it actually goes to the lookalike domain over plain http.",
    },
  ],
  objective_ids: ["LO1", "LO2"],
  sources: [SOURCE_CISA, SOURCE_FTC],
  explain: {
    no_action:
      "Leaving this one alone keeps the threat live. Three separate tells point the same way: the sender's domain swaps a 1 for an l [P1], the one-hour deadline exists to rush you [P2], and the link text does not match where the link actually goes [P3]. Reporting it would have let the security team block that domain before anyone else clicked. Want me to walk through how to compare a domain character by character?",
    verify_separately:
      "Verifying through a channel you already trust was a safe call, and it is exactly the habit that defeats this kind of message [P7]. The giveaways here were the lookalike sender domain [P1] and the mismatch between the link text and its real destination [P3]. Reporting it on top of verifying would also protect your coworkers [P8]. Shall I show you what a report should include?",
    report:
      "Reporting was the strongest response available [P8]. You picked up on a lookalike domain [P1] and a link whose text disagrees with its destination [P3], both of which are classic credential-harvesting signals. The password request in the body [P4] seals it. Want to see how this differs from a legitimate reset notice?",
  },
};

// ---------------------------------------------------------------------------
// N1-EM-002 -- Facilities badge reader maintenance. Legitimate, tier 2.
// ---------------------------------------------------------------------------

const EM002_BODY = `Facilities will be replacing the badge reader firmware on floors 2 and 3 between 1:00 AM and 3:00 AM tonight.

During the work, badge readers on those floors may be offline for a few minutes at a time. Security staff on site can let you through. Nothing is required from you, and there is nothing to sign in to.

Full notice and timings: https://intranet.brightfield.example/notices/badge-maintenance

Brightfield Facilities`;

const EM002: MockSpec = {
  public: {
    id: "N1-EM-002",
    tier: 2,
    email: {
      from_name: "Brightfield Facilities",
      from_address: "facilities@brightfield.example",
      reply_to: null,
      subject: "Scheduled badge reader maintenance tonight",
      body: EM002_BODY,
      links: [
        {
          display_text: "https://intranet.brightfield.example/notices/badge-maintenance",
          actual_url: "https://intranet.brightfield.example/notices/badge-maintenance",
        },
      ],
      attachments: [],
    },
    hint_basic: "Urgent timing is not the same as a request. Ask what this message actually wants you to do.",
  },
  is_malicious: false,
  best_action: "no_action",
  acceptable_actions: ["no_action", "verify_separately"],
  ai_hint: {
    text: "This one reads clean to me. The sender is on the company domain, the link stays on the intranet, and nothing is being asked of you. Tonight's timing is just a schedule.",
    stated_confidence: 0.78,
    ai_is_correct: true,
  },
  feedback: {
    no_action:
      "Correct. A time-sensitive notice is not the same as a suspicious one. This message asks nothing of you, the sender is on the company domain, and the link stays on the intranet.",
    verify_separately:
      "No harm done, and checking is never wrong. Worth noticing what made this one safe though: nothing is requested, there is nothing to sign in to, and the link goes where it says.",
    report:
      "A false alarm. Reporting costs the security team time they need for real threats. Urgent-sounding timing on its own is not evidence; look for a request, a credential prompt, or a link that disagrees with its text.",
  },
  clue_seeds: [
    {
      id: "C1",
      kind: "legit_signal",
      field: "from_address",
      text: "facilities@brightfield.example",
      why: "The sender is on the real company domain, spelled correctly, with no added words.",
    },
    {
      id: "C2",
      kind: "benign_oddity",
      field: "body",
      text: "between 1:00 AM and 3:00 AM tonight",
      why: "Looks like pressure, but it is only a schedule. The message asks for nothing and gives you nothing to click through to.",
    },
    {
      id: "C3",
      kind: "legit_signal",
      field: "body",
      text: "there is nothing to sign in to",
      why: "No credential prompt and no action required, which is the opposite of what a phishing message needs from you.",
    },
    {
      id: "C4",
      kind: "legit_signal",
      field: "link",
      text: "intranet.brightfield.example",
      why: "The real destination matches the link text exactly, and stays inside the company network.",
    },
  ],
  objective_ids: ["LO2", "LO3"],
  sources: [SOURCE_CISA, SOURCE_FTC],
  explain: {
    report:
      "This one was genuine, so the report was a false alarm. Urgency by itself is not evidence -- real operational notices often carry a deadline [P9]. What was missing here is the part that makes phishing work: no credential request [P4], and a link whose destination matches its text [P3]. Want a quick checklist for separating urgent from suspicious?",
    no_action:
      "Right call. Nothing was being asked of you, so nothing needed doing [P9]. Want to compare this against the helpdesk message to see the difference side by side?",
    verify_separately:
      "Checking was harmless, and verifying through a known channel is a good reflex to keep [P7]. For next time, the tells that this one was genuine were the matching link destination [P3] and the absence of any request [P9]. Shall I show you which details are worth a check and which are not?",
  },
};

// ---------------------------------------------------------------------------
// N1-EM-003 -- Payroll direct deposit. Phishing, tier 2.
// ---------------------------------------------------------------------------

const EM003_BODY = `Hello,

Payroll is migrating to a new direct deposit provider ahead of the next pay run. To avoid a delayed payment, please re-enter your banking details using the secure form below.

You will need your routing and account numbers to hand.

Secure form: https://payroll.brightfield.example/deposit

Replies to this message go to our migration team.

Brightfield Payroll`;

const EM003: MockSpec = {
  public: {
    id: "N1-EM-003",
    tier: 2,
    email: {
      from_name: "Brightfield Payroll",
      from_address: "payroll@brightfield.example",
      reply_to: "payroll.updates@brightfield-hr.example",
      subject: "Updated direct deposit form",
      body: EM003_BODY,
      links: [
        {
          display_text: "https://payroll.brightfield.example/deposit",
          actual_url: "https://brightfield-hr.example/secure/deposit-form",
        },
      ],
      attachments: [],
    },
    hint_basic: "The sender address looks right. Check whether a reply would actually go back to it.",
  },
  is_malicious: true,
  best_action: "report",
  acceptable_actions: ["report", "verify_separately"],
  ai_hint: {
    text: "The from address is clean, but the reply-to points at a different domain and the form link leaves the company. A request for banking details on top of that is enough for me. Report it.",
    stated_confidence: 0.85,
    ai_is_correct: true,
  },
  feedback: {
    report:
      "Correct, and well spotted -- this one hides behind a valid-looking sender address. The reply-to and the form link both point at an outside domain, and the message wants your bank details. Payroll changes are never made through a link in an email.",
    verify_separately:
      "Good instinct. A call to payroll on a number you already have would have ended this in seconds, and your bank details stayed put. Reporting it as well would have helped everyone else who got it.",
    no_action:
      "The threat is still active. A sender address can look perfect while the reply-to quietly points somewhere else -- and this message is asking for your routing and account numbers.",
  },
  clue_seeds: [
    {
      id: "C1",
      kind: "red_flag",
      field: "reply_to",
      text: "brightfield-hr.example",
      why: "Replies would leave the company. The sender address is on brightfield.example, but the reply-to is a different domain entirely.",
    },
    {
      id: "C2",
      kind: "red_flag",
      field: "body",
      text: "routing and account numbers",
      why: "A request for banking details. Real payroll changes happen in the payroll system, never through a form linked from an email.",
    },
    {
      id: "C3",
      kind: "red_flag",
      field: "body",
      text: "To avoid a delayed payment",
      why: "A financial consequence used as pressure, so you act before you check.",
    },
    {
      id: "C4",
      kind: "red_flag",
      field: "link",
      text: "brightfield-hr.example",
      why: "The link text shows a brightfield.example address, but the real destination is the same outside domain as the reply-to.",
    },
  ],
  objective_ids: ["LO1", "LO2"],
  sources: [SOURCE_CISA, SOURCE_FTC],
  explain: {
    no_action:
      "This one stays dangerous while it sits there. The sender address was genuine-looking, which is exactly why the reply-to matters: replies would have gone to an outside domain [P6]. Add a request for routing and account numbers [P4] and a link whose destination disagrees with its text [P3], and the picture is clear. Want me to show you where to find the reply-to in this mail client?",
    verify_separately:
      "Verifying through payroll on a number you already had was the right move [P7]. The tells were the reply-to pointing off-domain [P6] and the request for banking details [P4]. A report would also have warned the rest of the company [P8]. Want to see how this one differs from a real payroll notice?",
    report:
      "Good read on a subtle one [P8]. The from address was clean, so the evidence was the reply-to on a different domain [P6], the banking request [P4], and the link mismatch [P3]. Shall I cover what a payroll change request should look like instead?",
  },
};

// ---------------------------------------------------------------------------
// N1-EM-004 -- DocuShare shared document. Legitimate, tier 2.
// ---------------------------------------------------------------------------

const EM004_BODY = `Priya Raman shared a document with you.

"Q4 Access Review" - Priya added you as a reviewer and left a note: "Here's the sheet from our Tuesday sync. No rush, end of week is fine."

Open in DocuShare: https://docushare.brightfield.example/d/q4-access-review

You are receiving this because someone at Brightfield shared a file with your account. Manage notifications in your DocuShare settings.`;

const EM004: MockSpec = {
  public: {
    id: "N1-EM-004",
    tier: 2,
    email: {
      from_name: "DocuShare",
      from_address: "no-reply@docushare.brightfield.example",
      reply_to: null,
      subject: 'Priya Raman shared "Q4 Access Review" with you',
      body: EM004_BODY,
      links: [
        {
          display_text: "https://docushare.brightfield.example/d/q4-access-review",
          actual_url: "https://docushare.brightfield.example/d/q4-access-review",
        },
      ],
      attachments: [],
    },
    hint_basic: "A share notice is worth two checks: does the link match its text, and were you expecting this?",
  },
  is_malicious: false,
  best_action: "no_action",
  acceptable_actions: ["no_action", "verify_separately"],
  ai_hint: {
    text: "Internal sharing service, link matches its text, and the note refers to a meeting you were in. Nothing here needs reporting.",
    stated_confidence: 0.74,
    ai_is_correct: true,
  },
  feedback: {
    no_action:
      "Correct. The notice comes from Brightfield's own DocuShare, the link goes exactly where it says, and the context matches a meeting you were actually in. Expected share, no action needed.",
    verify_separately:
      "Fine, if a little cautious. A quick message to Priya costs nothing. The signals that this was genuine were the internal domain, the matching link, and the specific reference to your Tuesday sync.",
    report:
      "A false alarm. Share notifications are a favourite phishing disguise, so checking was right -- but everything here holds up: internal sender, matching link, and context you recognise. Reporting genuine mail wastes the security team's time.",
  },
  clue_seeds: [
    {
      id: "C1",
      kind: "legit_signal",
      field: "from_address",
      text: "docushare.brightfield.example",
      why: "The sharing service runs on a subdomain of the real company domain, not a lookalike.",
    },
    {
      id: "C2",
      kind: "legit_signal",
      field: "link",
      text: "docushare.brightfield.example/d/q4-access-review",
      why: "The real destination is character-for-character the same as the displayed link text.",
    },
    {
      id: "C3",
      kind: "legit_signal",
      field: "body",
      text: "Here's the sheet from our Tuesday sync",
      why: "Specific context only a real colleague would have. Phishing usually cannot be this particular.",
    },
    {
      id: "C4",
      kind: "benign_oddity",
      field: "body",
      text: "Manage notifications in your DocuShare settings",
      why: "Boilerplate that reads like a prompt to click, but it names a settings page rather than asking for credentials.",
    },
  ],
  objective_ids: ["LO2", "LO3"],
  sources: [SOURCE_CISA, SOURCE_FTC],
  explain: {
    report:
      "Share notifications really are a common disguise, so the suspicion was sound -- this particular one was genuine though. The link matched its text exactly [P3], the sender was on an internal subdomain [P1], and nothing asked for credentials [P4]. Want a short rule for telling a real share notice from a fake one?",
    no_action:
      "Right call, and for the right reasons: expected context and a link that goes where it claims [P3]. Shall I show you what a forged share notice usually gets wrong?",
    verify_separately:
      "A quick check with Priya costs very little, and verifying through a known channel is a habit worth keeping [P7]. The genuine signals here were the matching link destination [P3] and the specific meeting reference. Want to know which share notices are worth verifying?",
  },
};

// ---------------------------------------------------------------------------
// N1-EM-005 -- Unknown vendor invoice. Phishing, tier 1.
// ---------------------------------------------------------------------------

const EM005_BODY = `Dear Customer,

Please find attached invoice 20931 for services rendered. Our records show this amount is now 30 days overdue and the account will be passed to collections if payment is not confirmed today.

Open the attached file to view the full statement and payment instructions.

Accounts Receivable
Nordvale Supply Co.`;

const EM005: MockSpec = {
  public: {
    id: "N1-EM-005",
    tier: 1,
    email: {
      from_name: "Accounts Receivable",
      from_address: "billing@nordvale-supply.example",
      reply_to: null,
      subject: "Invoice attached, please review",
      body: EM005_BODY,
      links: [],
      attachments: ["Invoice_20931.pdf.exe"],
    },
    hint_basic: "Look at the end of the attachment's file name, and ask whether you were expecting this invoice at all.",
  },
  is_malicious: true,
  best_action: "report",
  acceptable_actions: ["report", "verify_separately"],
  ai_hint: {
    text: "That attachment ends in .exe behind a .pdf. It is a program, not an invoice. Report it and do not open it.",
    stated_confidence: 0.95,
    ai_is_correct: true,
  },
  feedback: {
    report:
      "Correct. The attachment ends .pdf.exe, which makes it a program dressed as a document. Add an unknown sender, a generic greeting and a collections threat, and there is nothing here worth opening.",
    verify_separately:
      "Safe. Nobody opened the file, and an unexpected invoice is exactly the kind of thing to check through accounts payable. Reporting it would also get the sender blocked.",
    no_action:
      "The threat is still live in the inbox. The attachment's real extension is .exe, so a single click would run a program. Unexpected invoices from senders you do not know are a standard malware delivery route.",
  },
  clue_seeds: [
    {
      id: "C1",
      kind: "red_flag",
      field: "attachment",
      text: ".pdf.exe",
      why: "A double extension. The file looks like a PDF but Windows will run it as a program.",
    },
    {
      id: "C2",
      kind: "red_flag",
      field: "body",
      text: "Dear Customer",
      why: "A generic greeting. A real supplier with an overdue account would know your name.",
    },
    {
      id: "C3",
      kind: "red_flag",
      field: "body",
      text: "passed to collections if payment is not confirmed today",
      why: "A financial threat on a same-day deadline, designed to make you open the file before thinking.",
    },
    {
      id: "C4",
      kind: "red_flag",
      field: "from_address",
      text: "nordvale-supply.example",
      why: "An unknown sender. This is not a supplier Brightfield has an account with.",
    },
  ],
  objective_ids: ["LO1", "LO2"],
  sources: [SOURCE_CISA, SOURCE_FTC],
  explain: {
    no_action:
      "This one is still sitting there with a live payload. The attachment's real extension is .exe hidden behind .pdf, so it is a program, not a statement [P5]. The generic greeting and the same-day collections threat are supporting evidence [P2]. Reporting it gets the sender blocked for everyone [P8]. Want me to explain how double extensions hide?",
    verify_separately:
      "Checking with accounts payable was safe and sensible [P7]. The decisive tell was the attachment ending .pdf.exe [P5], backed up by the generic greeting and the manufactured deadline [P2]. Reporting it would also stop it reaching your coworkers [P8]. Shall I cover which attachments are never safe to open?",
    report:
      "Exactly right [P8]. A .pdf.exe attachment is a program wearing a document's name [P5], and the unknown sender plus the collections threat leave no doubt [P2]. Want to see the other extensions worth refusing on sight?",
  },
};

// ---------------------------------------------------------------------------
// N1-EM-006 -- Dana in Accounting, lunch. Legitimate, tier 1.
// ---------------------------------------------------------------------------

const EM006_BODY = `Hey,

A few of us are going to the place on Fifth on Thusday around 12:30. You in? No pressure if you're still on nights.

Dana`;

const EM006: MockSpec = {
  public: {
    id: "N1-EM-006",
    tier: 1,
    email: {
      from_name: "Dana Whitfield",
      from_address: "dana.whitfield@brightfield.example",
      reply_to: null,
      subject: "Lunch on Thursday?",
      body: EM006_BODY,
      links: [],
      attachments: [],
    },
    hint_basic: "Ask the simplest question first: what does this message want you to do?",
  },
  is_malicious: false,
  best_action: "no_action",
  acceptable_actions: ["no_action"],
  ai_hint: {
    text: "A coworker on the company domain, no links, no attachments, nothing requested. There is nothing to act on here.",
    stated_confidence: 0.88,
    ai_is_correct: true,
  },
  feedback: {
    no_action:
      "Correct. A colleague on the company domain, no links, no attachments and no request. A typo is a typo, not an indicator.",
    verify_separately:
      "Harmless, but there was nothing here to verify. Spending a check on a message that asks for nothing is effort you will want for the ones that do.",
    report:
      "A false alarm, and a costly habit. Reporting ordinary mail from colleagues trains you to see threats everywhere, which makes the real ones harder to spot. A spelling mistake is not evidence.",
  },
  clue_seeds: [
    {
      id: "C1",
      kind: "legit_signal",
      field: "from_address",
      text: "dana.whitfield@brightfield.example",
      why: "A named colleague on the real company domain, in the standard firstname.lastname format.",
    },
    {
      id: "C2",
      kind: "benign_oddity",
      field: "body",
      text: "Thusday",
      why: "A typo. People make them; attackers using a template usually do not. On its own it means nothing.",
    },
    {
      id: "C3",
      kind: "legit_signal",
      field: "body",
      text: "No pressure if you're still on nights",
      why: "The opposite of urgency, and it shows the sender knows your actual schedule.",
    },
  ],
  objective_ids: ["LO2", "LO3"],
  sources: [SOURCE_CISA, SOURCE_FTC],
  explain: {
    report:
      "Nothing was wrong with this one. There was no request, no link and no attachment, which leaves a phishing message with no way to do anything [P9]. The misspelled day is just a typo -- a single odd detail is not proof of anything [P9]. Want a rule of thumb for when a message is worth reporting [P8]?",
    no_action:
      "Right call. No request, no link, no attachment, nothing to act on [P9]. Want to review what the three phishing messages tonight had in common?",
    verify_separately:
      "No harm in it, though there was nothing to check. Verifying is valuable when a message asks for something [P7]; this one asked for nothing [P9]. Shall I show you how to triage faster?",
  },
};

const SPECS: MockSpec[] = [EM001, EM002, EM003, EM004, EM005, EM006];

/** Seeded once at module load, so a bad span fails immediately and visibly. */
export const MOCK_CHALLENGES: MockChallenge[] = SPECS.map(({ clue_seeds, ...rest }) => ({
  ...rest,
  clues: seedClues(rest.public.email, clue_seeds),
}));

export const MOCK_BY_ID = new Map(MOCK_CHALLENGES.map((c) => [c.public.id, c]));
