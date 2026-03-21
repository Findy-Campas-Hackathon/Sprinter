"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { eventsApi } from "@/lib/api";
import { getAvatarFullUrl } from "@/lib/avatar";
import { getUser, isLoggedIn } from "@/lib/auth";
import { Event, Participant } from "@/lib/types";
import EventChat from "@/components/EventChat";
import VoiceChat from "@/components/VoiceChat";
import { ArrowLeft, Calendar, Clock, User, Users, Pencil, Trash2 } from "lucide-react";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUser = getUser();
  const loggedIn = isLoggedIn();
  const eventId = parseInt(id);

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    setError("");
    try {
      const [eventData, participantsData] = await Promise.all([
        eventsApi.get(eventId),
        eventsApi.listParticipants(eventId),
      ]);
      setEvent(eventData);
      setParticipants(participantsData ?? []);
      if (currentUser) {
        setIsParticipant((participantsData ?? []).some((p) => p.user_id === currentUser.id));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "イベントの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!loggedIn) { router.push("/login"); return; }
    setActionLoading(true); setError("");
    try { await eventsApi.join(eventId); await fetchEvent(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "参加に失敗しました"); }
    finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    setActionLoading(true); setError("");
    try { await eventsApi.cancelParticipation(eventId); await fetchEvent(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "キャンセルに失敗しました"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm("このイベントを削除しますか？")) return;
    try { await eventsApi.delete(eventId); router.push("/events"); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "削除に失敗しました"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>
      </div>
    );
  }

  if (!event) return null;

  const startDate = new Date(event.start_datetime);
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
  const durationHours = endDate ? Math.round(((endDate.getTime() - startDate.getTime()) / 3600000) * 10) / 10 : null;
  const isFull = (event.participant_count ?? 0) >= event.max_participants;
  const isOrganizer = currentUser?.id === event.organizer_id;
  const isAdmin = currentUser?.role === "admin";
  const canEdit = isOrganizer || isAdmin;
  const now = new Date();
  const isOngoing = startDate <= now && endDate != null && endDate > now;
  const isPast = endDate != null ? endDate <= now : startDate < now;

  const formatRemaining = (ms: number): string => {
    if (ms <= 0) return "まもなく終了";
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0 && m > 0) return `残り ${h}時間${m}分`;
    if (h > 0) return `残り ${h}時間`;
    return `残り ${m}分`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft size={16} />
        イベント一覧へ戻る
      </Link>

      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border p-8 mb-6 ${isOngoing ? "border-emerald-300 ring-2 ring-emerald-100" : "border-white/50"}`}>
        {isOngoing && (
          <div className="absolute -top-px left-8 right-8 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
        )}

        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-block bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ring-primary-200">
                {event.category}
              </span>
              {isOngoing && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ring-emerald-200 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  開催中
                </span>
              )}
              {isOngoing && endDate && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {formatRemaining(endDate.getTime() - now.getTime())}
                </span>
              )}
              {isPast && (
                <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">終了</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{event.title}</h1>
          </div>
          {canEdit && (
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <Link
                href={`/events/${event.id}/edit`}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                title="編集"
              >
                <Pencil size={16} />
              </Link>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Calendar size={12} />
              開始日時
            </div>
            <p className="text-sm font-medium text-gray-800">
              {startDate.toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          {endDate && (
            <div className="bg-gray-50/80 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Clock size={12} />
                所要時間
              </div>
              <p className="text-sm font-medium text-gray-800">{durationHours}時間</p>
            </div>
          )}
          <div className="bg-gray-50/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <User size={12} />
              主催者
            </div>
            <p className="text-sm font-medium text-gray-800">{event.organizer_name}</p>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Users size={12} />
              参加者
            </div>
            <p className="text-sm font-medium text-gray-800">
              {event.participant_count ?? 0} / {event.max_participants}
              {isFull && <span className="text-rose-500 ml-1 text-xs">（満員）</span>}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-2 text-sm">イベント概要</h2>
          <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{event.description}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>
        )}

        {!isOrganizer && (
          <div className="flex flex-col items-center gap-2">
            {isParticipant ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading || isOngoing}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-8 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {actionLoading ? "処理中..." : "参加をキャンセル"}
                </button>
                {isOngoing && <p className="text-xs text-orange-600">開催中のイベントはキャンセルできません</p>}
              </>
            ) : (
              <button
                onClick={handleJoin}
                disabled={actionLoading || isFull}
                className="gradient-primary text-white font-semibold px-10 py-2.5 rounded-xl shadow-md shadow-primary-500/25 hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {actionLoading ? "処理中..." : isFull ? "満員" : "参加する"}
              </button>
            )}
          </div>
        )}
      </div>

      {isOngoing && loggedIn && (isParticipant || isOrganizer) && event.end_datetime && (
        <div className="mb-6 space-y-4">
          <VoiceChat eventId={event.id} />
          <EventChat eventId={event.id} endDatetime={event.end_datetime} />
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={18} className="text-primary-500" />
          参加者 ({participants.length}人)
        </h2>
        {participants.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">まだ参加者はいません</p>
        ) : (
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center gap-3 text-sm text-gray-700 py-1.5 px-2 rounded-lg hover:bg-gray-50/80 transition-colors">
                {p.avatar_url ? (
                  <Image
                    src={getAvatarFullUrl(p.avatar_url)}
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-100"
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{p.user_name?.charAt(0)}</span>
                  </div>
                )}
                <span className="font-medium">{p.user_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
