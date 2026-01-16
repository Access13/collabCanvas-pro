"use client";

import type { CursorEntry } from "@/hooks/usePresence";

export function PresenceLayer({ cursors }: { cursors: CursorEntry[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute flex flex-col items-center"
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <circle cx="7" cy="7" r="5" fill={cursor.color} stroke="white" strokeWidth="2" />
          </svg>
          <span className="mt-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow">
            {cursor.name}
          </span>
        </div>
      ))}
    </div>
  );
}

