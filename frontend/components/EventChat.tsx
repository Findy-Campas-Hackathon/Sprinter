"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { messagesApi } from "@/lib/api";
import { getAvatarFullUrl } from "@/lib/avatar";
import { getUser } from "@/lib/auth";
import { Message } from "@/lib/types";
import { Send } from "lucide-react";

interface EventChatProps {
  eventId: number;
  endDatetime: string;
}

export default function EventChat({ eventId, endDatetime }: EventChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ended, setEnded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestIdRef = useRef(0);
  const currentUser = getUser();

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(
    async (sinceId?: number) => {
      try {
        const data = await messagesApi.list(eventId, sinceId);
        if (data && data.length > 0) {
          if (sinceId) setMessages((prev) => [...prev, ...data]);
          else setMessages(data);
          latestIdRef.current = data[data.length - 1].id;
          setTimeout(scrollToBottom, 100);
        }
      } catch { /* ignore */ }
    },
    [eventId, scrollToBottom]
  );

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (new Date(endDatetime) <= new Date()) { setEnded(true); clearInterval(interval); return; }
      fetchMessages(latestIdRef.current || undefined);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, endDatetime]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true); setError("");
    try {
      const msg = await messagesApi.send(eventId, content);
      setMessages((prev) => [...prev, { ...msg, user_name: currentUser?.name }]);
      latestIdRef.current = msg.id;
      setInput("");
      setTimeout(scrollToBottom, 100);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "送信に失敗しました"); }
    finally { setSending(false); }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 overflow-hidden flex flex-col" style={{ height: "480px" }}>
      <div className="gradient-primary text-white px-5 py-3 flex items-center gap-2 flex-shrink-0">
        <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
        <h2 className="font-semibold text-sm">ライブチャット</h2>
        <span className="ml-auto text-xs text-white/70">
          {ended ? "イベント終了" : "開催中"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            まだメッセージはありません。最初のメッセージを送りましょう！
          </div>
        )}
        {messages.map((msg) => {
          const isMe = currentUser?.id === msg.user_id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isMe ? "order-1" : ""}`}>
                {!isMe && (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {msg.avatar_url ? (
                      <Image src={getAvatarFullUrl(msg.avatar_url)} alt="" width={20} height={20}
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0" unoptimized />
                    ) : (
                      <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[9px] font-bold">{msg.user_name?.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500 font-medium">{msg.user_name}</span>
                  </div>
                )}
                <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                  isMe
                    ? "gradient-primary text-white rounded-tr-sm shadow-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm"
                }`}>
                  {msg.content}
                </div>
                <div className={`text-[10px] text-gray-400 mt-0.5 ${isMe ? "text-right" : "text-left"}`}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <div className="px-4 py-1 bg-red-50 text-red-500 text-xs flex-shrink-0">{error}</div>}

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white/80 flex-shrink-0">
        <input
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={ended ? "チャットは終了しました" : "メッセージを入力..."}
          disabled={ended || sending} maxLength={500}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 disabled:bg-gray-100 disabled:text-gray-400 transition-all"
        />
        <button type="submit" disabled={ended || sending || !input.trim()}
          className="gradient-primary text-white p-2.5 rounded-xl shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
