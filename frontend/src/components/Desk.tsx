import { selectClockMinute, useGame } from "../store/game";
import { formatClock } from "../lib/clock";
import { ACTION_LABELS } from "../lib/labels";
import { avatarFor } from "../lib/avatar";
import type { PublicChallenge } from "../types";

/**
 * The mail client on the in-game monitor. Chrome matches the real design
 * (U1-0 "Mail Client"): a macOS-style title bar, a search toolbar, a folder
 * sidebar, and avatar-led rows. The clock in the title bar is the live game
 * clock, not the mockup's static timestamp -- assets-guide.md: numbers stay
 * live, art doesn't. Unread rows carry a dot and bold text, so the marker is
 * never colour alone.
 */
export function Desk() {
  const current = useGame((s) => s.current);
  const unread = useGame((s) => s.unread);
  const openEmail = useGame((s) => s.openEmail);
  const queued = useGame((s) => s.queue.length);
  const clock = useGame(selectClockMinute);

  const unreadCount = current.filter((c) => unread.includes(c.id)).length;

  return (
    <div className="mail-client" style={{ width: "100%", height: "100%" }}>
      <div className="mail-titlebar">
        <span className="dot" style={{ background: "#e5534b" }} aria-hidden="true" />
        <span className="dot" style={{ background: "#e5b84b" }} aria-hidden="true" />
        <span className="dot" style={{ background: "#4bb56b" }} aria-hidden="true" />
        <span className="title">Mail · Inbox</span>
        <span className="time">{formatClock(clock)}</span>
      </div>

      <div className="mail-toolbar">
        <div className="mail-search">Search mail</div>
        <div className="mail-unread-badge">{unreadCount} unread</div>
      </div>

      <div className="mail-banner">Review every message. Trust nothing.</div>

      <div className="mail-body">
        <nav className="mail-sidebar" aria-label="Mail folders">
          <div className="compose">Compose</div>
          <ul>
            <li aria-current="true">
              <span>Inbox</span>
              <span className="count">{current.length}</span>
            </li>
            <li>Starred</li>
            <li>Sent</li>
            <li>Drafts</li>
            <li>Archive</li>
          </ul>
        </nav>

        <div className="mail-list">
          {current.length === 0 ? (
            <p className="mail-empty">No messages yet. The first batch arrives at the start of the shift.</p>
          ) : (
            <>
              {current.map((challenge) => (
                <MailRow
                  key={challenge.id}
                  challenge={challenge}
                  isUnread={unread.includes(challenge.id)}
                  onOpen={() => openEmail(challenge.id)}
                />
              ))}
              {queued > 0 && (
                <p className="mail-empty">
                  {queued} more {queued === 1 ? "message is" : "messages are"} expected later
                  tonight.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MailRow({
  challenge,
  isUnread,
  onOpen,
}: {
  challenge: PublicChallenge;
  isUnread: boolean;
  onOpen: () => void;
}) {
  const entry = useGame((s) => s.handled[challenge.id]);
  const { initial, color } = avatarFor(challenge.email.from_name);

  const classes = ["mail-row"];
  if (isUnread) classes.push("is-unread");
  if (entry) classes.push("is-handled");

  return (
    <button type="button" className={classes.join(" ")} onClick={onOpen}>
      <span className="mail-avatar" style={{ background: color }} aria-hidden="true">
        {initial}
      </span>
      <span className="mail-sender">
        {challenge.email.from_name}
        {isUnread && (
          <>
            {" "}
            <span className="unread-dot" aria-hidden="true" />
          </>
        )}
        <span className="sr-only">{isUnread ? " Unread." : ""}</span>
      </span>
      <span className="mail-subject">{challenge.email.subject}</span>
      {/* Its own fixed-width slot, not appended inside mail-subject: that span
          truncates with an ellipsis, which was swallowing the badge whole on
          long subjects instead of just clipping text around it. */}
      <span className="mail-outcome">
        {entry && (
          <span className={`outcome-chip outcome-${entry.result.outcome}`}>
            {entry.result.outcome}
          </span>
        )}
      </span>
      <span className="mail-meta">
        {entry ? ACTION_LABELS[entry.action] : challenge.email.attachments.length > 0 ? "1 file" : ""}
      </span>
    </button>
  );
}
