const ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(input: string, maxLength = 48) {
  return input
    .slice(0, maxLength)
    .replace(/[&<>"']/g, (match) => ENTITY_MAP[match]);
}

export function safeString(value: unknown, maxLength = 48) {
  if (typeof value !== "string") return "";
  return escapeHtml(value.trim(), maxLength);
}

