CollabCanvas Pro - MVP Plan (Updated)

Goal: Real-time collaborative whiteboard with anonymous rooms and in-memory
state. No auth, no database.

Structure
- app/
  - layout.tsx
  - providers.tsx               # Toaster / client providers
  - page.tsx                    # Home page
  - room/[id]/page.tsx          # Room UI
  - api/health/route.ts         # Health check
- components/
  - CanvasBoard.tsx             # Fabric canvas + sync + pan/zoom
  - Toolbar.tsx                 # Tools, export, clear
  - PresenceLayer.tsx           # SVG cursors + nicknames
  - ConnectionBadge.tsx         # Status indicator
  - ShareButton.tsx             # Copy room URL
  - ChatSidebar.tsx             # Simple chat
  - VoicePanel.tsx              # WebRTC audio controls
- hooks/
  - useCanvas.ts                # Fabric init + resize + touch support
  - useSocket.ts                # Socket.io lifecycle + reconnect status
  - usePresence.ts              # Cursor broadcast
  - useVoice.ts                 # WebRTC signaling + audio
  - useToolsStore.ts            # Zustand tools
- lib/
  - rooms.ts                    # In-memory canvas JSON
  - socket.ts                   # Socket.io server handlers
  - throttle.ts                 # Emit throttling
  - random.ts                   # Guest names/colors
- types/
  - events.ts                   # Socket event contracts
  - canvas.ts                   # Shared canvas types
- server.ts                     # Custom server with Socket.io

Bug Fix + UX Checklist
- Draw sync emits throttled to 100ms.
- Late join loads full canvas JSON via Fabric.loadFromJSON.
- Cursor presence as colored SVG + nickname labels.
- Mobile/touch drawing enabled (touchAction none + pointer events).
- Connection status + reconnect warnings (react-hot-toast).
- Invalid room IDs redirect home.
- Loading overlay while syncing.
- Infinite canvas pan/zoom (spacebar to pan, mouse wheel to zoom).
- Keyboard shortcuts: B = draw, E = eraser.
- ARIA labels on tool controls.
- JSON state is serialized for compact transport.
- Input sanitization + rate limiting on socket events.
- Cursor rendering batched with requestAnimationFrame.

Testing Notes
- Open two tabs in same room.
- Verify sync + cursor + chat + voice.
- Test reconnect: disable network in dev tools.
- Test touch emulation in Chrome dev tools.
- Run unit tests: `npm run test`.

CI/CD (Suggested)
- GitHub Actions workflow to run `npm ci`, `npm run lint`, `npm run test`.
- Add a build job for `npm run build` to verify production readiness.

Vercel Notes
- Vercel serverless does not support long-lived Socket.io servers.
- Deploy Socket.io separately and set `NEXT_PUBLIC_SOCKET_URL` in Vercel.
- Use `vercel.json` for rewrites and static hosting settings.
CollabCanvas Pro - MVP Plan

Goal: Production-grade MVP for a real-time collaborative whiteboard with anonymous rooms, in-memory state, and Socket.io + Next.js 14 App Router.

Planned File Structure

- app/
  - layout.tsx
  - page.tsx                  # Home page with Create Room button
  - room/
    - [id]/
      - page.tsx              # Room page (canvas + toolbar + presence)
  - api/
    - health/
      - route.ts              # Basic health check
- components/
  - CanvasBoard.tsx           # Fabric.js canvas, drawing sync
  - Toolbar.tsx               # Color picker, brush size, eraser, clear
  - PresenceLayer.tsx         # Remote cursors + nicknames overlay
  - ConnectionBadge.tsx       # Connected / reconnecting status
  - ShareButton.tsx           # Copy share URL
- hooks/
  - useCanvas.ts              # Fabric.js init + events
  - useSocket.ts              # Socket.io client lifecycle
  - usePresence.ts            # Cursor tracking + broadcast
- lib/
  - rooms.ts                  # In-memory Map<roomId, canvasJSON>
  - socket.ts                 # Socket.io server setup + types
  - throttle.ts               # Simple throttle for emit batching
- types/
  - events.ts                 # Socket event interfaces
  - canvas.ts                 # Point/Stroke types
- server.ts                   # Custom Next.js server + Socket.io attach
- next.config.mjs
- tailwind.config.ts
- postcss.config.mjs
- PLAN.md

MVP Feature Order
1) Home page: Create Room -> UUID -> redirect to /room/[id]
2) Room page: Fabric.js drawing tools (brush, color, size, eraser, clear)
3) Real-time sync: socket events for strokes + canvas JSON state
4) Presence: colored cursors + anonymous names
5) Late join sync: send full canvas JSON on join
6) Touch support
7) Connection status + reconnect handling

Stretch Goals (if time)
- Undo/redo
- Export PNG
- Sidebar chat

Notes
- No database; state lives in memory for active rooms only.
- Rooms are UUIDs via `uuid` lib.
- Use requestAnimationFrame + throttling for perf.
- Include accessibility labels and keyboard navigation.
- Add comments where Jest tests would be added (mock socket).

