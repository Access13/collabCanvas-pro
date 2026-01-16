import type {
  FabricCanvasJSON,
  FabricCanvasJSONSerialized,
  FabricObjectJSON,
} from "@/types/canvas";
import { parseCanvasJSON, serializeCanvasJSON } from "@/lib/serialize";

// Keep a bounded history per room to prevent unbounded memory growth.
const MAX_HISTORY = 50;

export interface RoomState {
  canvasJSON: FabricCanvasJSONSerialized | null;
  history: FabricObjectJSON[];
  redo: FabricObjectJSON[];
  chat: {
    roomId: string;
    message: string;
    name: string;
    color: string;
    userId: string;
    timestamp: number;
  }[];
}

const roomStates = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  const existing = roomStates.get(roomId);
  if (existing) return existing;
  const next: RoomState = { canvasJSON: null, history: [], redo: [], chat: [] };
  roomStates.set(roomId, next);
  return next;
}

export function getRoomState(roomId: string): RoomState {
  return getOrCreateRoom(roomId);
}

export function setRoomState(roomId: string, canvasJSON: FabricCanvasJSON) {
  const room = getOrCreateRoom(roomId);
  room.canvasJSON = serializeCanvasJSON(canvasJSON);
}

export function addStrokeToHistory(
  roomId: string,
  stroke: FabricObjectJSON,
  canvasJSON: FabricCanvasJSON | FabricCanvasJSONSerialized,
) {
  const room = getOrCreateRoom(roomId);
  const base = parseCanvasJSON(canvasJSON) ?? {};
  room.history.push(stroke);
  if (room.history.length > MAX_HISTORY) {
    room.history = room.history.slice(-MAX_HISTORY);
  }
  // Redo stack is cleared whenever a new stroke is added.
  room.redo = [];
  room.canvasJSON = serializeCanvasJSON({
    ...base,
    objects: room.history,
  });
}

export function applyUndo(roomId: string) {
  const room = getOrCreateRoom(roomId);
  const last = room.history.pop();
  if (last) {
    room.redo.unshift(last);
  }
  const base = parseCanvasJSON(room.canvasJSON) ?? {};
  room.canvasJSON = serializeCanvasJSON({
    ...base,
    objects: room.history,
  });
  return room;
}

export function applyRedo(roomId: string) {
  const room = getOrCreateRoom(roomId);
  const next = room.redo.shift();
  if (next) {
    room.history.push(next);
  }
  const base = parseCanvasJSON(room.canvasJSON) ?? {};
  room.canvasJSON = serializeCanvasJSON({
    ...base,
    objects: room.history,
  });
  return room;
}

export function clearRoomState(roomId: string) {
  roomStates.delete(roomId);
}

export function resetRoomCanvas(roomId: string, canvasJSON: FabricCanvasJSON) {
  const room = getOrCreateRoom(roomId);
  room.canvasJSON = serializeCanvasJSON(canvasJSON);
  room.history = [];
  room.redo = [];
}

// Keep recent chat messages per room to support late joiners.
const MAX_CHAT = 100;

export function addChatMessage(
  roomId: string,
  message: {
    roomId: string;
    message: string;
    name: string;
    color: string;
    userId: string;
    timestamp: number;
  },
) {
  const room = getOrCreateRoom(roomId);
  room.chat.push(message);
  if (room.chat.length > MAX_CHAT) {
    room.chat = room.chat.slice(-MAX_CHAT);
  }
  return room.chat;
}

export function getChatHistory(roomId: string) {
  return getOrCreateRoom(roomId).chat;
}

