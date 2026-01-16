const GUEST_NAMES = [
  "Guest",
  "Sketcher",
  "Doodler",
  "Collaborator",
  "Artist",
];

const CURSOR_COLORS = [
  "#F97316",
  "#22C55E",
  "#3B82F6",
  "#A855F7",
  "#EC4899",
  "#EAB308",
];

export function getRandomGuestName() {
  const suffix = Math.floor(Math.random() * 900 + 100);
  const prefix = GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];
  return `${prefix}${suffix}`;
}

export function getRandomCursorColor() {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
}

