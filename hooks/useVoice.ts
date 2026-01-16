"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/types/events";

interface UseVoiceParams {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  roomId: string;
}

interface UseVoiceState {
  enabled: boolean;
  muted: boolean;
  error: string | null;
  streams: Record<string, MediaStream>;
  toggleEnabled: () => Promise<void>;
  toggleMuted: () => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useVoice({ socket, roomId }: UseVoiceParams): UseVoiceState {
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streams, setStreams] = useState<Record<string, MediaStream>>({});

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const createPeer = useCallback(
    (peerId: string) => {
      if (!socket || !localStreamRef.current) return null;
      if (peersRef.current.has(peerId)) return peersRef.current.get(peerId) ?? null;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice", {
            roomId,
            targetId: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        setStreams((prev) => ({ ...prev, [peerId]: stream }));
      };

      peersRef.current.set(peerId, pc);
      return pc;
    },
    [roomId, socket],
  );

  const closePeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.close();
      peersRef.current.delete(peerId);
    }
    setStreams((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  const startVoice = useCallback(async () => {
    if (!socket || enabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
      setEnabled(true);
      setError(null);
      socket.emit("webrtc:peers:request", { roomId });
    } catch (err) {
      setError("Microphone access denied.");
    }
  }, [enabled, muted, roomId, socket]);

  const stopVoice = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    setStreams({});
    setEnabled(false);
  }, []);

  const toggleEnabled = useCallback(async () => {
    if (enabled) {
      stopVoice();
    } else {
      await startVoice();
    }
  }, [enabled, startVoice, stopVoice]);

  const toggleMuted = useCallback(() => {
    if (!localStreamRef.current) return;
    const nextMuted = !muted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setMuted(nextMuted);
  }, [muted]);

  useEffect(() => {
    if (!socket) return;

    const handlePeers = async ({ peers }: { peers: string[] }) => {
      if (!enabled) return;
      for (const peerId of peers) {
        const pc = createPeer(peerId);
        if (!pc) continue;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc:offer", { roomId, targetId: peerId, sdp: offer });
      }
    };

    const handleOffer = async ({
      fromId,
      sdp,
    }: {
      fromId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      if (!enabled) return;
      const pc = createPeer(fromId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc:answer", { roomId, targetId: fromId, sdp: answer });
    };

    const handleAnswer = async ({
      fromId,
      sdp,
    }: {
      fromId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const pc = peersRef.current.get(fromId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const handleIce = async ({
      fromId,
      candidate,
    }: {
      fromId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peersRef.current.get(fromId);
      if (!pc) return;
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleLeft = ({ userId }: { userId: string }) => closePeer(userId);

    socket.on("webrtc:peers", handlePeers);
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice", handleIce);
    socket.on("user:left", handleLeft);

    return () => {
      socket.off("webrtc:peers", handlePeers);
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice", handleIce);
      socket.off("user:left", handleLeft);
    };
  }, [closePeer, createPeer, enabled, roomId, socket]);

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, [stopVoice]);

  return {
    enabled,
    muted,
    error,
    streams,
    toggleEnabled,
    toggleMuted,
  };
}

