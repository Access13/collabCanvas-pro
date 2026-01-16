import { useEffect, useRef } from "react";
import * as fabric from "fabric";

export function useCanvas() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canvasElementRef.current || canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasElementRef.current, {
      isDrawingMode: true,
      selection: false,
      preserveObjectStacking: true,
    });

    canvasRef.current = canvas;
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();
    canvas.defaultCursor = "crosshair";
    if (canvas.upperCanvasEl) {
      canvas.upperCanvasEl.style.touchAction = "none";
    }

    // Resize observer keeps the canvas matched to its container for responsive layouts.
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      canvas.setDimensions({ width: rect.width, height: rect.height });
      canvas.renderAll();
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
      canvasRef.current = null;
    };
  }, []);

  return { canvasRef, canvasElementRef, containerRef };
}

