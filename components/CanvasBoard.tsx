"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as fabric from "fabric";
import type { Socket } from "socket.io-client";

import { PresenceLayer } from "@/components/PresenceLayer";
import { useCanvas } from "@/hooks/useCanvas";
import { useToolsStore } from "@/hooks/useToolsStore";
import { parseCanvasJSON, serializeCanvasJSON } from "@/lib/serialize";
import { throttle } from "@/lib/throttle";
import type { CursorEntry } from "@/hooks/usePresence";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/events";

export interface CanvasBoardHandle {
  clear: () => void;
  exportPNG: () => void;
}

interface CanvasBoardProps {
  roomId: string;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  cursors: CursorEntry[];
  emitCursor: (x: number, y: number) => void;
  isSyncing?: boolean;
  onCanvasReady?: () => void;
  onHistoryUpdate?: (historyLength: number, redoLength: number) => void;
}

export const CanvasBoard = forwardRef<CanvasBoardHandle, CanvasBoardProps>(function CanvasBoard(
  { roomId, socket, cursors, emitCursor, isSyncing, onCanvasReady, onHistoryUpdate },
  ref,
) {
  const { color, size, mode } = useToolsStore();
  const { canvasRef, canvasElementRef, containerRef } = useCanvas();
  const canvasReadyRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);
  const spacePressedRef = useRef(false);

  const emitStroke = useMemo(
    () =>
      throttle((payload: { stroke: fabric.Path; canvasJSON: Record<string, unknown> }) => {
        if (!socket) return;
        socket.emit("draw:stroke", {
          roomId,
          stroke: payload.stroke.toJSON(),
          canvasJSON: serializeCanvasJSON(payload.canvasJSON),
        });
      }, 80),
    [roomId, socket],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePathCreated = (event: { path: fabric.Path }) => {
      const path = event.path;
      if (!path) return;
      const canvasJSON = canvas.toJSON();
      emitStroke({ stroke: path, canvasJSON });
    };

    canvas.on("path:created", handlePathCreated);
    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [canvasRef, emitStroke]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }

    const brush = canvas.freeDrawingBrush as fabric.PencilBrush & {
      globalCompositeOperation?: string;
    };
    brush.width = size;
    if (mode === "erase") {
      brush.color = "#000000";
      brush.globalCompositeOperation = "destination-out";
    } else {
      brush.color = color;
      brush.globalCompositeOperation = "source-over";
    }
  }, [color, size, mode, canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !socket) return;

    const handleRemoteStroke = ({
      stroke,
      userId,
    }: {
      stroke: Record<string, unknown>;
      userId: string;
    }) => {
      if (userId === socket.id) return;
      void fabric.util
        .enlivenObjects([stroke])
        .then((objects) => {
          objects.forEach((obj) => {
            if (obj && typeof obj === "object" && "type" in obj) {
              canvas.add(obj as fabric.FabricObject);
            }
          });
          canvas.renderAll();
        })
        .catch(() => undefined);
    };

    const handleCanvasState = ({
      canvasJSON,
      history,
      redo,
    }: {
      canvasJSON: Record<string, unknown> | string | null;
      history?: Record<string, unknown>[];
      redo?: Record<string, unknown>[];
    }) => {
      if (!canvasReadyRef.current) {
        canvasReadyRef.current = true;
        onCanvasReady?.();
      }
      if (history || redo) {
        onHistoryUpdate?.(history?.length ?? 0, redo?.length ?? 0);
      }
      const parsed = parseCanvasJSON(canvasJSON);
      if (!parsed) return;
      canvas.loadFromJSON(parsed, () => {
        canvas.isDrawingMode = true;
        canvas.selection = false;
        canvas.backgroundColor = "#ffffff";
        canvas.renderAll();
      });
    };

    const handleClear = () => {
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
    };

    const handleHistorySync = ({
      historyLength,
      redoLength,
    }: {
      historyLength: number;
      redoLength: number;
    }) => {
      onHistoryUpdate?.(historyLength, redoLength);
    };

    socket.on("draw:stroke", handleRemoteStroke);
    socket.on("canvas:state", handleCanvasState);
    socket.on("canvas:clear", handleClear);
    socket.on("history:undo", handleCanvasState);
    socket.on("history:redo", handleCanvasState);
    socket.on("history:sync", handleHistorySync);

    return () => {
      socket.off("draw:stroke", handleRemoteStroke);
      socket.off("canvas:state", handleCanvasState);
      socket.off("canvas:clear", handleClear);
      socket.off("history:undo", handleCanvasState);
      socket.off("history:redo", handleCanvasState);
      socket.off("history:sync", handleHistorySync);
    };
  }, [canvasRef, onCanvasReady, onHistoryUpdate, socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.upperCanvasEl) return;

    const element = canvas.upperCanvasEl;
    const handlePointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      emitCursor(event.clientX - rect.left, event.clientY - rect.top);
    };

    element.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      element.removeEventListener("pointermove", handlePointerMove);
    };
  }, [canvasRef, emitCursor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        spacePressedRef.current = true;
        canvas.defaultCursor = "grab";
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        spacePressedRef.current = false;
        canvas.defaultCursor = "crosshair";
      }
    };

    const handleMouseDown = (event: fabric.TEvent) => {
      if (!spacePressedRef.current) return;
      const nativeEvent = event.e as MouseEvent | undefined;
      if (!nativeEvent) return;
      isPanningRef.current = true;
      lastPanPointRef.current = { x: nativeEvent.clientX, y: nativeEvent.clientY };
      canvas.isDrawingMode = false;
      canvas.defaultCursor = "grabbing";
    };

    const handleMouseMove = (event: fabric.TEvent) => {
      if (!isPanningRef.current) return;
      const nativeEvent = event.e as MouseEvent | undefined;
      if (!nativeEvent || !lastPanPointRef.current) return;
      const deltaX = nativeEvent.clientX - lastPanPointRef.current.x;
      const deltaY = nativeEvent.clientY - lastPanPointRef.current.y;
      const transform = canvas.viewportTransform;
      if (transform) {
        transform[4] += deltaX;
        transform[5] += deltaY;
        canvas.setViewportTransform(transform);
      }
      lastPanPointRef.current = { x: nativeEvent.clientX, y: nativeEvent.clientY };
    };

    const handleMouseUp = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      canvas.isDrawingMode = true;
      canvas.defaultCursor = spacePressedRef.current ? "grab" : "crosshair";
    };

    const handleWheel = (event: fabric.TEvent) => {
      const nativeEvent = event.e as WheelEvent | undefined;
      if (!nativeEvent) return;
      const zoom = canvas.getZoom();
      const delta = -nativeEvent.deltaY;
      const zoomFactor = Math.min(Math.max(zoom + delta / 500, 0.5), 4);
      canvas.zoomToPoint(new fabric.Point(nativeEvent.offsetX, nativeEvent.offsetY), zoomFactor);
      nativeEvent.preventDefault();
      nativeEvent.stopPropagation();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    canvas.on("mouse:wheel", handleWheel);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
      canvas.off("mouse:wheel", handleWheel);
    };
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.defaultCursor = mode === "erase" ? "cell" : "crosshair";
  }, [canvasRef, mode]);

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.clear();
        canvas.backgroundColor = "#ffffff";
        canvas.renderAll();

        if (socket) {
          socket.emit("canvas:clear", {
            roomId,
            canvasJSON: serializeCanvasJSON(canvas.toJSON()),
          });
        }
      },
      exportPNG: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL({ format: "png", quality: 1, multiplier: 1 });
        void fetch(dataUrl)
          .then((response) => response.blob())
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `collab-canvas-${roomId}.png`;
            link.click();
            URL.revokeObjectURL(url);
          })
          .catch(() => undefined);
      },
    }),
    [canvasRef, roomId, socket],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <canvas ref={canvasElementRef} className="h-full w-full touch-none" />
      <PresenceLayer cursors={cursors} />
      {isSyncing ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-slate-500">
          Syncing canvas...
        </div>
      ) : null}
    </div>
  );
});

