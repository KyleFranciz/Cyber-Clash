import { useEffect, useMemo, useRef, useState } from "react";

import { BALANCE } from "../balance";
import { useAnswer, useExplain, useHint } from "../api/hooks";
import { numberClues } from "../lib/clues";
import { DECISION_PROMPT } from "../lib/labels";
import { useGame } from "../store/game";
import { ActionButton } from "./ActionButton";
import { AiMessage } from "./AiMessage";
import { FeedbackCard } from "./FeedbackCard";
import { HighlightedText } from "./HighlightedText";
import type { Action, AnswerResult, PublicChallenge } from "../types";

const ACTIONS: Action[] = ["no_action", "verify_separately", "report"];

const FOCUSABLE =
  'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function EmailModal({ challenge }: { challenge: PublicChallenge }) {
  const mode = useGame((s) => s.mode);
  const runId = useGame((s) => s.runId);
  const power = useGame((s) => s.power);
  const hint = useGame((s) => s.hints[challenge.id]);
  const handled = useGame((s) => s.handled[challenge.id]);
  const storedExplanation = useGame((s) => s.explanations[challenge.id]);
  const chargeHint = useGame((s) => s.chargeHint);
  const applyAnswer = useGame((s) => s.applyAnswer);
  const setExplanation = useGame((s) => s.setExplanation);
  const closeModal = useGame((s) => s.closeModal);

  const answerMutation = useAnswer();
  const hintMutation = useHint();
  const explainMutation = useExplain();

  // The decision, once made, lives in the store -- `handled` survives closing
  // and reopening the email, so this modal doubles as the review view.
  const result: AnswerResult | undefined = handled?.result;
  const decided = Boolean(result);
  const deciding = answerMutation.isPending;

  const [explainPending, setExplainPending] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const hintCost = BALANCE[mode].aiHintPowerCost;
  const canAffordHint = power >= hintCost;

  const clueNumbers = useMemo(
    () => (result ? numberClues(result.clues) : new Map<string, number>()),
    [result],
  );

  // Trap focus inside the dialog and restore it on close.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        // Escape does nothing during a decision (docs/frontend-spec.md).
        // Once the outcome is on screen it closes the review.
        event.preventDefault();
        if (decided && !explainPending) closeModal();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decided, explainPending, closeModal]);

  async function buyHint() {
    if (hint || !canAffordHint || hintMutation.isPending) return;
    try {
      const reply = await hintMutation.mutateAsync({ runId, challengeId: challenge.id });
      // Power is only spent once the hint is actually in hand.
      chargeHint(challenge.id, reply);
    } catch (error) {
      // An unavailable hint is not worth an error screen; the free hint stands.
      console.warn("[hint] could not fetch the A.E.G.I.S. hint.", error);
    }
  }

  async function choose(action: Action) {
    if (decided || deciding) return;
    let answered: AnswerResult;
    try {
      answered = await answerMutation.mutateAsync({
        runId,
        challengeId: challenge.id,
        action,
        hintUsed: Boolean(hint),
      });
    } catch (error) {
      // The server owns the answer key, so without it there is no outcome to
      // show. Leave the buttons live so the player can try again.
      console.error("[answer] /api/answer failed; the decision was not recorded.", error);
      return;
    }

    applyAnswer(challenge, action, answered);

    // A reduced outcome earns the deeper explanation. Explanations are free at
    // every difficulty (architecture rule 10).
    if (answered.explain_recommended) {
      setExplainPending(true);
      // useExplain never rejects: a failure arrives as fallback: true.
      const reply = await explainMutation.mutateAsync({
        runId,
        challengeId: challenge.id,
        action,
      });
      setExplanation(challenge.id, reply);
      setExplainPending(false);
    }
  }

  const { email } = challenge;
  const explanation = storedExplanation;

  return (
    <div className="modal-scrim">
      <div
        className="email-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-subject"
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="email-head">
          <span className="email-head-title">INSPECTING · EMAIL</span>
          <button
            type="button"
            className="email-close"
            aria-label="Close"
            disabled={!decided}
            onClick={decided ? closeModal : undefined}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 2L12 12M12 2L2 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="email-fields">
          <div className="email-field-row">
            <span className="email-field-label">FROM</span>
            <span className="email-field-value">
              {decided && result ? (
                <>
                  <span className="email-from-name">
                    <HighlightedText
                      text={email.from_name}
                      clues={result.clues}
                      field="from_name"
                      numbers={clueNumbers}
                    />
                  </span>
                  <span className="email-from-address">
                    <HighlightedText
                      text={email.from_address}
                      clues={result.clues}
                      field="from_address"
                      numbers={clueNumbers}
                    />
                  </span>
                </>
              ) : (
                <>
                  <span className="email-from-name">{email.from_name}</span>
                  <span className="email-from-address">{email.from_address}</span>
                </>
              )}
            </span>
          </div>

          {email.reply_to && (
            <div className="email-field-row">
              <span className="email-field-label">REPLY-TO</span>
              <span className="email-field-value">
                <span className="email-from-address">
                  {decided && result ? (
                    <HighlightedText
                      text={email.reply_to}
                      clues={result.clues}
                      field="reply_to"
                      numbers={clueNumbers}
                    />
                  ) : (
                    email.reply_to
                  )}
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="email-scroll">
          <div className="email-body-block">
            <h2 className="email-subject" id="email-subject">
              {decided && result ? (
                <HighlightedText
                  text={email.subject}
                  clues={result.clues}
                  field="subject"
                  numbers={clueNumbers}
                />
              ) : (
                email.subject
              )}
            </h2>
            <p className="email-body">
              {decided && result ? (
                <HighlightedText
                  text={email.body}
                  clues={result.clues}
                  field="body"
                  numbers={clueNumbers}
                />
              ) : (
                email.body
              )}
            </p>
          </div>

          {(email.links.length > 0 || email.attachments.length > 0) && (
            <div className="email-action-block">
              {email.links.length > 0 && (
                <div className="link-strip">
                  {email.links.map((link, index) => {
                    const mismatch = link.display_text !== link.actual_url;
                    return (
                      <div className="link-row" key={index}>
                        <div>
                          <span className="label">Text says</span>
                          {link.display_text}
                        </div>
                        <div>
                          <span className="label">Really goes</span>
                          {/* Only the first link's clues are highlighted: the
                              contract gives a clue one field name, with no index. */}
                          {decided && result && index === 0 ? (
                            <HighlightedText
                              text={link.actual_url}
                              clues={result.clues}
                              field="link"
                              numbers={clueNumbers}
                            />
                          ) : (
                            link.actual_url
                          )}
                        </div>
                        {mismatch && (
                          <p className="link-mismatch">
                            The link text and its real destination do not match.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {email.attachments.length > 0 && (
                <div className="attachment-strip">
                  <h3>Attachments</h3>
                  {email.attachments.map((attachment, index) => (
                    <div className="attachment-row" key={attachment}>
                      {decided && result && index === 0 ? (
                        <HighlightedText
                          text={attachment}
                          clues={result.clues}
                          field="attachment"
                          numbers={clueNumbers}
                        />
                      ) : (
                        attachment
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="hint-basic">
            <strong>Basic hint</strong>
            <br />
            {challenge.hint_basic}
          </div>

          {hint ? (
            <div className="hint-ai">
              <div className="hint-ai-top">
                <div className="hint-ai-badges">
                  <span className="hint-ai-badge">A.E.G.I.S. HINT</span>
                  <span className="hint-ai-cost">−{hintCost}% PWR</span>
                </div>
                <div className="hint-ai-confidence">
                  <span className="hint-ai-confidence-label">
                    CONFIDENCE {Math.round(hint.stated_confidence * 100)}%
                  </span>
                  <span className="hint-ai-meter">
                    <span
                      className="hint-ai-meter-fill"
                      style={{ width: `${Math.round(hint.stated_confidence * 100)}%` }}
                    />
                  </span>
                </div>
              </div>
              <p className="hint-ai-text">{hint.text}</p>
            </div>
          ) : (
            <button
              type="button"
              className="hint-button"
              onClick={buyHint}
              disabled={!canAffordHint || hintMutation.isPending || decided}
            >
              {hintMutation.isPending
                ? "Asking A.E.G.I.S..."
                : canAffordHint
                  ? `Ask A.E.G.I.S. for a hint (−${hintCost} power)`
                  : `Not enough power for a hint (needs ${hintCost})`}
            </button>
          )}

          {result && (
            <FeedbackCard result={result}>
              <AiMessage pending={explainPending} reply={explanation} />
            </FeedbackCard>
          )}
        </div>

        {decided ? (
          <div className="modal-foot">
            <button type="button" className="close-button" onClick={closeModal}>
              Back to the inbox
            </button>
          </div>
        ) : (
          <div className="decision-bar">
            <p className="decision-prompt">{DECISION_PROMPT}</p>
            <div className="decision-buttons">
              {ACTIONS.map((action) => (
                <ActionButton key={action} action={action} disabled={deciding} onChoose={choose} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
