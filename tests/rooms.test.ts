import { addStrokeToHistory, applyRedo, applyUndo, getRoomState } from "@/lib/rooms";

describe("rooms history", () => {
  it("tracks undo/redo", () => {
    const roomId = "room-1";
    addStrokeToHistory(roomId, { type: "path" }, { objects: [] });
    addStrokeToHistory(roomId, { type: "rect" }, { objects: [] });

    const stateBefore = getRoomState(roomId);
    expect(stateBefore.history.length).toBe(2);

    applyUndo(roomId);
    const stateAfterUndo = getRoomState(roomId);
    expect(stateAfterUndo.history.length).toBe(1);
    expect(stateAfterUndo.redo.length).toBe(1);

    applyRedo(roomId);
    const stateAfterRedo = getRoomState(roomId);
    expect(stateAfterRedo.history.length).toBe(2);
    expect(stateAfterRedo.redo.length).toBe(0);
  });
});

