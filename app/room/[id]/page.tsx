"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { validate as isUuid } from "uuid";

import { CanvasBoard, type CanvasBoardHandle } from "@/components/CanvasBoard";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { ShareButton } from "@/components/ShareButton";
import { Toolbar } from "@/components/Toolbar";
import { VoicePanel } from "@/components/VoicePanel";
import { usePresence } from "@/hooks/usePresence";
import { useSocket } from "@/hooks/useSocket";
import { useToolsStore } from "@/hooks/useToolsStore";
import { getRandomCursorColor, getRandomGuestName } from "@/lib/random";
import { safeString } from "@/lib/sanitize";

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roomId = params?.id ?? "";

  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [ready, setReady] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [historyLength, setHistoryLength] = useState(0);
  const [redoLength, setRedoLength] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState("Canvas ready.");

  const boardRef = useRef<CanvasBoardHandle | null>(null);
  const setMode = useToolsStore((state) => state.setMode);

  useEffect(() => {
    if (!roomId) return;
    if (!isUuid(roomId)) {
      router.replace("/");
      return;
    }
    if (ready) return;

    const suggested = getRandomGuestName();
    const nickname =
      typeof window !== "undefined"
        ? window.prompt("Enter a nickname", suggested) || suggested
        : suggested;

    setName(safeString(nickname, 24) || suggested);
    setColor(getRandomCursorColor());
    setReady(true);
    setCanvasReady(false);
  }, [roomId, ready, router]);

  const { socket, status } = useSocket({ roomId, name, color });
  const { cursors, emitCursor } = usePresence({ socket, roomId, name, color });

  const cursorList = useMemo(() => Object.values(cursors), [cursors]);

  useEffect(() => {
    if (!status) return;
    if (status === "reconnecting") {
      toast.loading("Reconnecting to room...", { id: "socket-status" });
    } else if (status === "connected") {
      toast.success("Connected", { id: "socket-status" });
    } else if (status === "error") {
      toast.error("Offline. Check your connection.", { id: "socket-status" });
    } else {
      toast.loading("Connecting...", { id: "socket-status" });
    }
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      if (event.key.toLowerCase() === "e") {
        setMode("erase");
      }
      if (event.key.toLowerCase() === "b") {
        setMode("draw");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setMode]);

  const isSyncing = !canvasReady;
  const showLoading = !ready;
  const canUndo = historyLength > 0 && status === "connected";
  const canRedo = redoLength > 0 && status === "connected";

  useEffect(() => {
    if (canvasReady) return;
    const timeout = window.setTimeout(() => {
      setCanvasReady(true);
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [canvasReady]);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>
      {showLoading ? (
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-600">
            Preparing your canvas...
          </div>
        </main>
      ) : (
        <>
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Room {roomId}</h1>
              <p className="text-sm text-slate-500">Signed in as {name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setChatOpen((prev) => !prev)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                aria-label={chatOpen ? "Hide chat" : "Show chat"}
              >
                {chatOpen ? "Hide chat" : "Show chat"}
              </button>
              <ConnectionBadge status={status} />
              <VoicePanel socket={socket} roomId={roomId} />
              <ShareButton />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
            <Toolbar
              onClear={() => boardRef.current?.clear()}
              onExport={() => boardRef.current?.exportPNG()}
              onUndo={() => socket?.emit("history:undo", { roomId })}
              onRedo={() => socket?.emit("history:redo", { roomId })}
              undoDisabled={!canUndo}
              redoDisabled={!canRedo}
            />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:flex-row">
              <div className="flex min-h-0 min-w-0 flex-1">
                <CanvasBoard
                  ref={boardRef}
                  roomId={roomId}
                  socket={socket}
                  cursors={cursorList}
                  emitCursor={emitCursor}
                  isSyncing={isSyncing}
                  onCanvasReady={() => setCanvasReady(true)}
                  onHistoryUpdate={(history, redo) => {
                    setHistoryLength(history);
                    setRedoLength(redo);
                  }}
                />
              </div>
              <div className="h-96 lg:h-full lg:w-80">
                <ChatSidebar
                  socket={socket}
                  roomId={roomId}
                  name={name}
                  color={color}
                  isOpen={chatOpen}
                  alwaysVisible
                  onClose={() => setChatOpen(false)}
                  onAnnounce={(message) => setLiveMessage(message)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

