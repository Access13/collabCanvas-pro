import type { FabricCanvasJSON, FabricCanvasJSONSerialized } from "@/types/canvas";

export function serializeCanvasJSON(
  canvasJSON: FabricCanvasJSON | FabricCanvasJSONSerialized,
) {
  if (typeof canvasJSON === "string") {
    return canvasJSON;
  }
  // JSON.stringify produces a compact, whitespace-free string.
  return JSON.stringify(canvasJSON);
}

export function parseCanvasJSON(
  canvasJSON: FabricCanvasJSON | FabricCanvasJSONSerialized | null,
): FabricCanvasJSON | null {
  if (!canvasJSON) return null;
  if (typeof canvasJSON === "string") {
    try {
      return JSON.parse(canvasJSON) as FabricCanvasJSON;
    } catch {
      return null;
    }
  }
  return canvasJSON;
}

