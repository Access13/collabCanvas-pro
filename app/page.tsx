"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const router = useRouter();

  const handleCreateRoom = () => {
    const roomId = uuidv4();
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-16 lg:flex-row">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            CollabCanvas Pro
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">
            Real-time collaborative whiteboarding for teams.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Spin up a shared canvas instantly, invite teammates with a link, and
            sketch together with live cursors and synced strokes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleCreateRoom}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create Room
            </button>
            <span className="text-sm text-slate-500">
              No sign-up required. Sessions reset on server restart.
            </span>
          </div>
        </div>
        <div className="w-full max-w-2xl">
          <Image
            src="/demo.svg"
            alt="CollabCanvas Pro demo preview"
            width={1200}
            height={675}
            priority
            className="h-auto w-full rounded-3xl border border-slate-200 bg-white shadow-sm"
          />
        </div>
      </main>
    </div>
  );
}
