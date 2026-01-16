# CollabCanvas Pro

Real-time collaborative whiteboard MVP with anonymous rooms, live cursors, chat, and voice. Fabric.js drawing is synced over Socket.io with in-memory room state.

## Features

- Anonymous rooms via shareable URL (UUID)
- Real-time drawing sync, cursors, chat, and voice
- Undo/redo and export to PNG
- In-memory canvas state for active sessions
- Tailwind UI with keyboard-accessible tools
- Mobile/touch-ready drawing surface

## Tech Stack

- Next.js 14+ (App Router) + TypeScript
- Fabric.js for canvas drawing
- Socket.io for realtime events
- Zustand for tool state
- Tailwind CSS via PostCSS

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run start
```

## Environment Variables

- `NEXT_PUBLIC_SOCKET_URL` (optional): Point the client to an external Socket.io server.
  - Example: `https://collabcanvas-pro-socket.fly.dev`

## Vercel Deployment

Vercel supports Next.js hosting but **does not support long-lived WebSocket servers** in serverless functions. For realtime collaboration, you have two options:

1) **Deploy frontend to Vercel**, and run the Socket.io server on a Node-friendly platform (Render, Fly.io, Railway, DigitalOcean).
   - Set `NEXT_PUBLIC_SOCKET_URL` on Vercel to the Socket.io server URL.
2) **Deploy the full app to a Node host** and run `server.ts` directly.

### Deploy steps (Vercel)
1. `vercel` → follow prompts.
2. Add `NEXT_PUBLIC_SOCKET_URL` in Vercel Project Settings if using a separate socket server.
3. Redeploy.

## Troubleshooting

- **No realtime updates on Vercel**: WebSockets are not supported on Vercel serverless. Use a separate Socket.io server and set `NEXT_PUBLIC_SOCKET_URL`.
- **CORS errors**: Ensure the socket server allows the Vercel origin.
- **Share button fails**: Some browsers block clipboard access without user interaction.

## Testing Notes

```bash
npm run test
```

Add Cypress end-to-end tests for drawing, chat, and reconnect flows when expanding coverage.
# collabCanvas-pro
