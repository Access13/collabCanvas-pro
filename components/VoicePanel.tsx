"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Socket } from "socket.io-client";

import { useVoice } from "@/hooks/useVoice";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/events";

interface VoicePanelProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  roomId: string;
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.srcObject = stream;
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline />;
}

export function VoicePanel({ socket, roomId }: VoicePanelProps) {
  const { enabled, muted, error, streams, toggleEnabled, toggleMuted } = useVoice({
    socket,
    roomId,
  });

  const participantCount = useMemo(
    () => Object.keys(streams).length + (enabled ? 1 : 0),
    [enabled, streams],
  );

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
      <button
        type="button"
        onClick={() => void toggleEnabled()}
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          enabled
            ? "bg-rose-600 text-white hover:bg-rose-500"
            : "bg-slate-900 text-white hover:bg-slate-800"
        }`}
        aria-pressed={enabled}
      >
        {enabled ? "Leave voice" : "Enable voice"}
      </button>
      <button
        type="button"
        onClick={toggleMuted}
        disabled={!enabled}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {muted ? "Unmute" : "Mute"}
      </button>
      <span className="text-xs text-slate-500">Voice: {participantCount}</span>
      {error ? <span className="text-xs text-rose-500">{error}</span> : null}
      {Object.entries(streams).map(([peerId, stream]) => (
        <RemoteAudio key={peerId} stream={stream} />
      ))}
    </div>
  );
}

