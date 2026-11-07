import { NIGHT_LENGTH_GAME_MINUTES } from "../balance";

/**
 * Game minutes since midnight -> a 12-hour clock face. 0 reads "12:00 AM",
 * 360 reads "6:00 AM". Values past the end of the night clamp, so the HUD
 * never shows 6:01 AM.
 */
export function formatClock(gameMinutes: number): string {
  const clamped = Math.max(0, Math.min(NIGHT_LENGTH_GAME_MINUTES, gameMinutes));
  const totalMinutes = Math.floor(clamped);
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} AM`;
}

/** "12:14 AM" style timestamp for a message row in the inbox. */
export function formatArrival(gameMinutes: number): string {
  return formatClock(gameMinutes);
}
