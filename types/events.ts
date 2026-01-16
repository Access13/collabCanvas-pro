import type { FabricCanvasJSON, FabricCanvasJSONSerialized, FabricObjectJSON } from "./canvas";

export interface JoinPayload {
  roomId: string;
  name: string;
  color: string;
}

export interface StrokePayload {
  roomId: string;
  stroke: FabricObjectJSON;
  canvasJSON: FabricCanvasJSON | FabricCanvasJSONSerialized;
}

export interface CanvasStatePayload {
  roomId: string;
  canvasJSON: FabricCanvasJSON | FabricCanvasJSONSerialized | null;
  history?: FabricObjectJSON[];
  redo?: FabricObjectJSON[];
}

export interface ClearPayload {
  roomId: string;
  canvasJSON: FabricCanvasJSON | FabricCanvasJSONSerialized;
}

export interface CursorPayload {
  roomId: string;
  x: number;
  y: number;
  name: string;
  color: string;
}

export interface CursorBroadcastPayload extends CursorPayload {
  userId: string;
}

export interface UserLeftPayload {
  roomId: string;
  userId: string;
}

export interface ChatMessagePayload {
  roomId: string;
  message: string;
  name: string;
  color: string;
}

export interface ChatMessageBroadcastPayload extends ChatMessagePayload {
  userId: string;
  timestamp: number;
}

export interface ChatHistoryPayload {
  roomId: string;
  messages: ChatMessageBroadcastPayload[];
}

export interface WebRTCPeersPayload {
  roomId: string;
  peers: string[];
}

export interface WebRTCOfferPayload {
  roomId: string;
  targetId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface WebRTCAnswerPayload {
  roomId: string;
  targetId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface WebRTCIcePayload {
  roomId: string;
  targetId: string;
  candidate: RTCIceCandidateInit;
}

export interface ClientToServerEvents {
  "room:join": (payload: JoinPayload) => void;
  "draw:stroke": (payload: StrokePayload) => void;
  "canvas:clear": (payload: ClearPayload) => void;
  "cursor:move": (payload: CursorPayload) => void;
  "chat-message": (payload: ChatMessagePayload) => void;
  "webrtc:peers:request": (payload: { roomId: string }) => void;
  "webrtc:offer": (payload: WebRTCOfferPayload) => void;
  "webrtc:answer": (payload: WebRTCAnswerPayload) => void;
  "webrtc:ice": (payload: WebRTCIcePayload) => void;
  "history:undo": (payload: { roomId: string }) => void;
  "history:redo": (payload: { roomId: string }) => void;
}

export interface ServerToClientEvents {
  "canvas:state": (payload: CanvasStatePayload) => void;
  "draw:stroke": (payload: StrokePayload & { userId: string }) => void;
  "canvas:clear": (payload: { roomId: string }) => void;
  "cursor:move": (payload: CursorBroadcastPayload) => void;
  "user:left": (payload: UserLeftPayload) => void;
  "chat-message": (payload: ChatMessageBroadcastPayload) => void;
  "chat-history": (payload: ChatHistoryPayload) => void;
  "history:undo": (payload: CanvasStatePayload) => void;
  "history:redo": (payload: CanvasStatePayload) => void;
  "history:sync": (payload: { roomId: string; historyLength: number; redoLength: number }) => void;
  "webrtc:peers": (payload: WebRTCPeersPayload) => void;
  "webrtc:offer": (payload: {
    roomId: string;
    fromId: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;
  "webrtc:answer": (payload: {
    roomId: string;
    fromId: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;
  "webrtc:ice": (payload: {
    roomId: string;
    fromId: string;
    candidate: RTCIceCandidateInit;
  }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  roomId?: string;
  name?: string;
  color?: string;
}

