"use client";

import type { ConnectionStatus } from "@/hooks/useSocket";

const STATUS_STYLES: Record<ConnectionStatus, string> = {
  connecting: "bg-amber-100 text-amber-800",
  connected: "bg-emerald-100 text-emerald-800",
  reconnecting: "bg-amber-100 text-amber-800",
  error: "bg-rose-100 text-rose-800",
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connecting: "Connecting",
  connected: "Connected",
  reconnecting: "Reconnecting",
  error: "Offline",
};

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
      aria-live="polite"
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

