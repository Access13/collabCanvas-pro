import type { Server } from "socket.io";

import {
  addStrokeToHistory,
  applyRedo,
  applyUndo,
  addChatMessage,
  clearRoomState,
  getChatHistory,
  getRoomState,
  resetRoomCanvas,
  setRoomState,
} from "@/lib/rooms";
import { safeString } from "@/lib/sanitize";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@/types/events";

export function initSocketServer(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
) {
  const limiter = new Map<string, { count: number; resetAt: number }>();
  const shouldRateLimit = (socketId: string, limit = 120, windowMs = 1000) => {
    const now = Date.now();
    const record = limiter.get(socketId);
    if (!record || record.resetAt < now) {
      limiter.set(socketId, { count: 1, resetAt: now + windowMs });
      return false;
    }
    record.count += 1;
    if (record.count > limit) {
      return true;
    }
    return false;
  };

  const isValidRoom = (roomId: unknown) => typeof roomId === "string" && roomId.length > 8;

  const emitPeers = (roomId: string, socketId: string) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const peers = room ? Array.from(room).filter((id) => id !== socketId) : [];
    io.to(socketId).emit("webrtc:peers", { roomId, peers });
  };

  io.on("connection", (socket) => {
    socket.on("room:join", ({ roomId, name, color }) => {
      if (!isValidRoom(roomId)) return;
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.name = safeString(name, 24);
      socket.data.color = safeString(color, 16);

      const currentState = getRoomState(roomId);
      socket.emit("canvas:state", {
        roomId,
        canvasJSON: currentState.canvasJSON,
        history: currentState.history,
        redo: currentState.redo,
      });
      socket.emit("chat-history", { roomId, messages: getChatHistory(roomId) });
      emitPeers(roomId, socket.id);
    });

    socket.on("draw:stroke", ({ roomId, stroke, canvasJSON }) => {
      if (!isValidRoom(roomId) || shouldRateLimit(socket.id, 180, 1000)) return;
      if (!stroke || typeof stroke !== "object") return;
      addStrokeToHistory(roomId, stroke, canvasJSON);
      socket.to(roomId).emit("draw:stroke", { roomId, stroke, canvasJSON, userId: socket.id });
      const state = getRoomState(roomId);
      io.to(roomId).emit("history:sync", {
        roomId,
        historyLength: state.history.length,
        redoLength: state.redo.length,
      });
    });

    socket.on("canvas:clear", ({ roomId, canvasJSON }) => {
      if (!isValidRoom(roomId)) return;
      if (typeof canvasJSON === "string") {
        resetRoomCanvas(roomId, JSON.parse(canvasJSON) as Record<string, unknown>);
      } else {
        resetRoomCanvas(roomId, canvasJSON);
      }
      socket.to(roomId).emit("canvas:clear", { roomId });
      io.to(roomId).emit("history:sync", { roomId, historyLength: 0, redoLength: 0 });
    });

    socket.on("cursor:move", ({ roomId, x, y, name, color }) => {
      if (!isValidRoom(roomId) || shouldRateLimit(socket.id, 240, 1000)) return;
      if (typeof x !== "number" || typeof y !== "number") return;
      socket.to(roomId).emit("cursor:move", {
        roomId,
        userId: socket.id,
        x,
        y,
        name: safeString(name, 24),
        color: safeString(color, 16),
      });
    });

    socket.on("chat-message", ({ roomId, message, name, color }) => {
      if (!isValidRoom(roomId) || shouldRateLimit(socket.id, 24, 1000)) return;
      const trimmed = safeString(message, 280);
      if (!trimmed) return;
      const payload = {
        roomId,
        message: trimmed,
        name: safeString(name, 24),
        color: safeString(color, 16),
        userId: socket.id,
        timestamp: Date.now(),
      };
      addChatMessage(roomId, payload);
      io.to(roomId).emit("chat-message", payload);
    });

    socket.on("history:undo", ({ roomId }) => {
      if (!isValidRoom(roomId) || shouldRateLimit(socket.id, 30, 1000)) return;
      const state = applyUndo(roomId);
      io.to(roomId).emit("history:undo", {
        roomId,
        canvasJSON: state.canvasJSON,
        history: state.history,
        redo: state.redo,
      });
    });

    socket.on("history:redo", ({ roomId }) => {
      if (!isValidRoom(roomId) || shouldRateLimit(socket.id, 30, 1000)) return;
      const state = applyRedo(roomId);
      io.to(roomId).emit("history:redo", {
        roomId,
        canvasJSON: state.canvasJSON,
        history: state.history,
        redo: state.redo,
      });
    });

    socket.on("webrtc:peers:request", ({ roomId }) => {
      emitPeers(roomId, socket.id);
    });

    socket.on("webrtc:offer", ({ roomId, targetId, sdp }) => {
      io.to(targetId).emit("webrtc:offer", { roomId, fromId: socket.id, sdp });
    });

    socket.on("webrtc:answer", ({ roomId, targetId, sdp }) => {
      io.to(targetId).emit("webrtc:answer", { roomId, fromId: socket.id, sdp });
    });

    socket.on("webrtc:ice", ({ roomId, targetId, candidate }) => {
      io.to(targetId).emit("webrtc:ice", { roomId, fromId: socket.id, candidate });
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      socket.to(roomId).emit("user:left", { roomId, userId: socket.id });

      const room = io.sockets.adapter.rooms.get(roomId);
      if (!room || room.size === 0) {
        clearRoomState(roomId);
      }
    });
  });
}

