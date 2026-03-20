"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { eventsApi } from "@/lib/api";
import { getUser, isLoggedIn } from "@/lib/auth";
import { Event, Participant } from "@/lib/types";

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
        setIsParticipant(
          (participantsData ?? []).some((p) => p.user_id === currentUser.id)
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "イベントの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      await eventsApi.join(eventId);
      await fetchEvent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "参加に失敗しました");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    setError("");
    try {
      await eventsApi.cancelParticipation(eventId);
      await fetchEvent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "キャンセルに失敗しました");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("このイベントを削除しますか？")) return;
    try {
      await eventsApi.delete(eventId);
      router.push("/events");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400">
        読み込み中...
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-4 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!event) return null;

  const startDate = new Date(event.start_datetime);
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
  const isFull = (event.participant_count ?? 0) >= event.max_participants;
  const isOrganizer = currentUser?.id === event.organizer_id;
  const isAdmin = currentUser?.role === "admin";
  const canEdit = isOrganizer || isAdmin;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/events" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">
        ← イベント一覧へ戻る
      </Link>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded mb-2">
              {event.category}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          </div>
          {canEdit && (
            <div className="flex gap-2 ml-4">
              <Link
                href={`/events/${event.id}/edit`}
                className="text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-300 px-3 py-1 rounded"
              >
                編集
              </Link>
              <button
                onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-800 border border-red-300 px-3 py-1 rounded"
              >
                削除
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-600">
          <div>
            <span className="font-medium text-gray-700">開始日時</span>
            <p>
              {startDate.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          {endDate && (
            <div>
              <span className="font-medium text-gray-700">終了日時</span>
              <p>
                {endDate.toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-700">主催者</span>
            <p>{event.organizer_name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">参加者</span>
            <p>
              {event.participant_count ?? 0} / {event.max_participants}人
              {isFull && <span className="text-red-500 ml-1">(満員)</span>}
            </p>
          </div>
          {event.location_url && (
            <div className="col-span-2">
              <span className="font-medium text-gray-700">場所</span>
              <p>
                <a
                  href={event.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  {event.location_url}
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4 mb-6">
          <h2 className="font-semibold text-gray-700 mb-2">イベント概要</h2>
          <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">
            {event.description}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {!isOrganizer && (
          <div className="flex justify-center">
            {isParticipant ? (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-8 py-2 rounded-lg disabled:opacity-50"
              >
                {actionLoading ? "処理中..." : "参加をキャンセル"}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={actionLoading || isFull}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-2 rounded-lg disabled:opacity-50"
              >
                {actionLoading ? "処理中..." : isFull ? "満員" : "参加する"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="font-semibold text-gray-800 mb-4">
          参加者 ({participants.length}人)
        </h2>
        {participants.length === 0 ? (
          <p className="text-gray-400 text-sm">まだ参加者はいません</p>
        ) : (
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-xs">
                  {p.user_name?.charAt(0) ?? "?"}
                </div>
                {p.user_name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
