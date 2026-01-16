import { create } from "zustand";

export type ToolMode = "draw" | "erase";

interface ToolsState {
  color: string;
  size: number;
  mode: ToolMode;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setMode: (mode: ToolMode) => void;
}

export const useToolsStore = create<ToolsState>((set) => ({
  color: "#111827",
  size: 6,
  mode: "draw",
  setColor: (color) => set({ color }),
  setSize: (size) => set({ size }),
  setMode: (mode) => set({ mode }),
}));

