import { useEffect, useMemo, useRef, useState } from "react";

import { throttle } from "@/lib/throttle";
import type {
  ClientToServerEvents,
  CursorBroadcastPayload,
  ServerToClientEvents,
} from "@/types/events";
import type { Socket } from "socket.io-client";

export interface CursorEntry {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

interface UsePresenceParams {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  roomId: string;
  name: string;
  color: string;
}

export function usePresence({ socket, roomId, name, color }: UsePresenceParams) {
  const [cursors, setCursors] = useState<Record<string, CursorEntry>>({});
  const pendingRef = useRef<Record<string, CursorEntry>>({});
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleCursor = (payload: CursorBroadcastPayload) => {
      if (payload.userId === socket.id) return;
      pendingRef.current[payload.userId] = {
        userId: payload.userId,
        name: payload.name,
        color: payload.color,
        x: payload.x,
        y: payload.y,
      };
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setCursors((prev) => ({
          ...prev,
          ...pendingRef.current,
        }));
        pendingRef.current = {};
        rafRef.current = null;
      });
    };

    const handleLeft = ({ userId }: { userId: string }) => {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    socket.on("cursor:move", handleCursor);
    socket.on("user:left", handleLeft);

    return () => {
      socket.off("cursor:move", handleCursor);
      socket.off("user:left", handleLeft);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [socket]);

  const emitCursor = useMemo(
    () =>
      throttle((x: number, y: number) => {
        if (!socket) return;
        socket.emit("cursor:move", { roomId, x, y, name, color });
      }, 40),
    [socket, roomId, name, color],
  );

  return { cursors, emitCursor };
}

