/**
 * A colored initial circle per sender, matching the real mail client design
 * (U1-0 "Mail Client" rows: a 32px circle, the sender's first letter, white
 * text). The palette is the same set of hues the mockup uses across its
 * sample senders, cycled deterministically by name so a given sender always
 * gets the same color without a lookup table per email.
 */
const AVATAR_COLORS = [
  "#2f7dd1", // blue
  "#8e5bc4", // purple
  "#e08a2e", // orange
  "#3fa37a", // green
  "#6b7b8b", // slate
  "#4c6a8a", // steel
];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function avatarFor(fromName: string): { initial: string; color: string } {
  const initial = fromName.trim().charAt(0).toUpperCase() || "?";
  const color = AVATAR_COLORS[hashString(fromName) % AVATAR_COLORS.length];
  return { initial, color };
}
