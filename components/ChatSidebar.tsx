"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import type {
  ChatMessageBroadcastPayload,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/events";
import { safeString } from "@/lib/sanitize";

interface ChatSidebarProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  roomId: string;
  name: string;
  color: string;
  isOpen: boolean;
  onClose?: () => void;
  alwaysVisible?: boolean;
  onAnnounce?: (message: string) => void;
}

export function ChatSidebar({
  socket,
  roomId,
  name,
  color,
  isOpen,
  onClose,
  alwaysVisible,
  onAnnounce,
}: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessageBroadcastPayload[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (payload: ChatMessageBroadcastPayload) => {
      setMessages((prev) => [...prev, payload]);
      onAnnounce?.(`${payload.name} says ${payload.message}`);
    };

    const handleHistory = ({ messages: history }: { messages: ChatMessageBroadcastPayload[] }) => {
      setMessages(history);
    };

    socket.on("chat-message", handleMessage);
    socket.on("chat-history", handleHistory);
    return () => {
      socket.off("chat-message", handleMessage);
      socket.off("chat-history", handleHistory);
    };
  }, [socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const isConnected = socket?.connected ?? false;

  const sendMessage = () => {
    if (!socket || !isConnected) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    socket.emit("chat-message", { roomId, message: safeString(trimmed, 280), name, color });
    setDraft("");
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage();
  };

  const renderedMessages = useMemo(
    () =>
      messages.map((msg) => ({
        ...msg,
        isSelf: msg.userId === socket?.id,
      })),
    [messages, socket?.id],
  );

  return (
    <aside
      className={`${
        isOpen ? "flex" : "hidden"
      } h-full w-full flex-col rounded-3xl border border-slate-200 bg-white shadow-sm lg:w-80 lg:resize-x lg:overflow-auto lg:min-w-[18rem] lg:max-w-[32rem] ${
        alwaysVisible ? "lg:flex" : ""
      }`}
    >
      <header className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Room chat</h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 lg:hidden"
              aria-label="Close chat sidebar"
            >
              Close
            </button>
          ) : null}
        </div>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {renderedMessages.length === 0 ? (
          <p className="text-sm text-slate-400">
            No messages yet. Say hello!
          </p>
        ) : (
          renderedMessages.map((message) => (
            <div
              key={`${message.userId}-${message.timestamp}`}
              className={`flex flex-col gap-1 text-sm ${
                message.isSelf ? "items-end" : "items-start"
              }`}
            >
              <span className="text-xs font-semibold text-slate-500">
                {message.isSelf ? "You" : message.name}
              </span>
              <span
                className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                  message.isSelf
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {message.message}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} className="border-t border-slate-200 p-3">
        <label className="sr-only" htmlFor="chat-message">
          Send a message
        </label>
        <div className="flex items-center gap-2">
          <input
            id="chat-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isConnected ? "Type a message" : "Connecting..."}
            className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}

