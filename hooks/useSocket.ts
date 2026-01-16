import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/types/events";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "error";

interface UseSocketParams {
  roomId: string;
  name: string;
  color: string;
}

const SOCKET_PATH = "/api/socketio";

export function useSocket({ roomId, name, color }: UseSocketParams) {
  const socketRef =
    useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    if (!roomId || !name || !color) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const socket = io(socketUrl ?? undefined, {
      path: socketUrl ? undefined : SOCKET_PATH,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      socket.emit("room:join", { roomId, name, color });
    });

    socket.io.on("reconnect_attempt", () => setStatus("reconnecting"));
    socket.io.on("reconnect", () => setStatus("connected"));
    socket.io.on("reconnect_error", () => setStatus("error"));
    socket.io.on("reconnect_failed", () => setStatus("error"));
    socket.on("disconnect", () => setStatus("reconnecting"));
    socket.on("connect_error", () => setStatus("error"));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, name, color]);

  return {
    socket: socketRef.current,
    status,
  };
}

