import { renderHook } from "@testing-library/react";
import { io } from "socket.io-client";

import { useSocket } from "@/hooks/useSocket";

jest.mock("socket.io-client", () => {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  const mockSocket = {
    id: "socket-1",
    connected: true,
    io: {
      on: jest.fn((event: string, cb: (...args: unknown[]) => void) => {
        listeners[event] = listeners[event] ?? [];
        listeners[event].push(cb);
      }),
    },
    on: jest.fn((event: string, cb: (...args: unknown[]) => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
    }),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };

  return {
    io: jest.fn(() => mockSocket),
    __esModule: true,
  };
});

describe("useSocket", () => {
  it("emits room:join on connect", () => {
    renderHook(() =>
      useSocket({
        roomId: "room-123",
        name: "Guest123",
        color: "#111111",
      }),
    );

    const socketInstance = (io as jest.Mock).mock.results[0].value;
    expect(socketInstance.on).toHaveBeenCalledWith("connect", expect.any(Function));
  });
});

