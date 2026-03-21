"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getToken, getUser } from "@/lib/auth";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";

interface VoiceChatProps {
  eventId: number;
}

interface PeerState {
  userId: number;
  name: string;
  connection: RTCPeerConnection;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VoiceChat({ eventId }: VoiceChatProps) {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [peers, setPeers] = useState<Map<number, { name: string }>>(new Map());
  const [error, setError] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<number, HTMLAudioElement>>(new Map());
  const currentUser = getUser();

  const cleanupCall = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    audioElementsRef.current.forEach((el) => {
      el.pause();
      el.srcObject = null;
    });
    audioElementsRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setPeers(new Map());
    setInCall(false);
    setMuted(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  const createPeerConnection = useCallback(
    (remoteUserId: number, remoteName: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "ice-candidate",
              to: remoteUserId,
              payload: event.candidate,
            })
          );
        }
      };

      pc.ontrack = (event) => {
        let audio = audioElementsRef.current.get(remoteUserId);
        if (!audio) {
          audio = new Audio();
          audio.autoplay = true;
          audioElementsRef.current.set(remoteUserId, audio);
        }
        audio.srcObject = event.streams[0];
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          pc.close();
          peerConnectionsRef.current.delete(remoteUserId);
          audioElementsRef.current.get(remoteUserId)?.pause();
          audioElementsRef.current.delete(remoteUserId);
          setPeers((prev) => {
            const next = new Map(prev);
            next.delete(remoteUserId);
            return next;
          });
        }
      };

      peerConnectionsRef.current.set(remoteUserId, pc);
      setPeers((prev) => {
        const next = new Map(prev);
        next.set(remoteUserId, { name: remoteName });
        return next;
      });

      return pc;
    },
    []
  );

  const joinCall = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
    } catch {
      setError("マイクへのアクセスが許可されませんでした");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("ログインが必要です");
      return;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//localhost:8081/v1/events/${eventId}/voice?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setInCall(true);
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "peers": {
          for (const p of msg.peers || []) {
            if (p.user_id === currentUser?.id) continue;
            const pc = createPeerConnection(p.user_id, p.name);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(
              JSON.stringify({
                type: "offer",
                to: p.user_id,
                payload: offer,
              })
            );
          }
          break;
        }

        case "peer-joined": {
          if (msg.from === currentUser?.id) break;
          const pc = createPeerConnection(msg.from, msg.from_name);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(
            JSON.stringify({
              type: "offer",
              to: msg.from,
              payload: offer,
            })
          );
          break;
        }

        case "peer-left": {
          const pc = peerConnectionsRef.current.get(msg.from);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(msg.from);
          }
          audioElementsRef.current.get(msg.from)?.pause();
          audioElementsRef.current.delete(msg.from);
          setPeers((prev) => {
            const next = new Map(prev);
            next.delete(msg.from);
            return next;
          });
          break;
        }

        case "offer": {
          let pc = peerConnectionsRef.current.get(msg.from);
          if (!pc) {
            pc = createPeerConnection(msg.from, msg.from_name);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(
            JSON.stringify({
              type: "answer",
              to: msg.from,
              payload: answer,
            })
          );
          break;
        }

        case "answer": {
          const pc = peerConnectionsRef.current.get(msg.from);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
          }
          break;
        }

        case "ice-candidate": {
          const pc = peerConnectionsRef.current.get(msg.from);
          if (pc && msg.payload) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
          }
          break;
        }
      }
    };

    ws.onerror = () => {
      setError("接続エラーが発生しました");
    };

    ws.onclose = () => {
      cleanupCall();
    };
  }, [eventId, currentUser?.id, createPeerConnection, cleanupCall]);

  const leaveCall = useCallback(() => {
    cleanupCall();
  }, [cleanupCall]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMuted(!audioTrack.enabled);
      }
    }
  }, []);

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${inCall ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
          <span className="text-white text-sm font-semibold">
            音声通話
          </span>
          {inCall && (
            <span className="text-gray-400 text-xs">
              {peers.size}人が参加中
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {inCall && (
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full transition-colors ${
                muted
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              title={muted ? "ミュート解除" : "ミュート"}
            >
              {muted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}

          {inCall ? (
            <button
              onClick={leaveCall}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            >
              <PhoneOff size={14} />
              退出
            </button>
          ) : (
            <button
              onClick={joinCall}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            >
              <Phone size={14} />
              参加する
            </button>
          )}
        </div>
      </div>

      {inCall && peers.size > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {Array.from(peers.entries()).map(([userId, info]) => (
            <div
              key={userId}
              className="flex items-center gap-1.5 bg-gray-800 px-2.5 py-1 rounded-full"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-gray-300 text-xs">{info.name}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="px-4 pb-2">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
