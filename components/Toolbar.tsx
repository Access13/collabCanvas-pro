"use client";

import { useToolsStore } from "@/hooks/useToolsStore";

interface ToolbarProps {
  onClear: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  undoDisabled?: boolean;
  redoDisabled?: boolean;
}

export function Toolbar({
  onClear,
  onExport,
  onUndo,
  onRedo,
  undoDisabled,
  redoDisabled,
}: ToolbarProps) {
  const { color, size, mode, setColor, setSize, setMode } = useToolsStore();

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur"
      role="toolbar"
      aria-label="Drawing tools"
    >
      <button
        type="button"
        onClick={() => setMode("draw")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          mode === "draw"
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
        aria-pressed={mode === "draw"}
        aria-label="Draw tool"
      >
        Draw
      </button>
      <button
        type="button"
        onClick={() => setMode("erase")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          mode === "erase"
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
        aria-pressed={mode === "erase"}
        aria-label="Eraser tool"
      >
        Erase
      </button>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        Color
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-slate-200"
          aria-label="Choose brush color"
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        Size
        <input
          type="range"
          min={2}
          max={32}
          value={size}
          onChange={(event) => setSize(Number(event.target.value))}
          className="accent-slate-900"
          aria-label="Brush size"
        />
        <span className="min-w-[2rem] text-xs text-slate-500">{size}px</span>
      </label>

      <button
        type="button"
        onClick={onClear}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        aria-label="Clear canvas"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={undoDisabled}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        aria-label="Undo last stroke"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={redoDisabled}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        aria-label="Redo stroke"
      >
        Redo
      </button>
      <button
        type="button"
        onClick={onExport}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        aria-label="Export canvas as PNG"
      >
        Export
      </button>
    </div>
  );
}

