"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { userApi } from "@/lib/api";
import { getUser, isLoggedIn } from "@/lib/auth";
import { Event } from "@/lib/types";

function EventTable({ events, emptyMessage }: { events: Event[]; emptyMessage: string }) {
  if (events.length === 0) {
    return <div className="text-center py-12 text-gray-400">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-100 shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-4 py-3 font-medium">イベント名</th>
            <th className="px-4 py-3 font-medium">カテゴリー</th>
            <th className="px-4 py-3 font-medium">開始日時</th>
            <th className="px-4 py-3 font-medium">参加人数</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-indigo-50/40 transition-colors duration-150">
              <td className="px-4 py-3 font-medium text-gray-900">
                <Link href={`/events/${event.id}`} className="hover:text-indigo-600 transition-colors">
                  {event.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="inline-block px-2.5 py-0 text-xs font-medium">
                  {event.category}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {new Date(event.start_datetime).toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {event.participant_count ?? 0} / {event.max_participants}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [myParticipations, setMyParticipations] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"organized" | "joined">("organized");

  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [events, participations] = await Promise.all([
        userApi.myEvents(),
        userApi.myParticipations(),
      ]);
      setMyEvents(events ?? []);
      setMyParticipations(participations ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-400">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.name} さん</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("organized")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "organized"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          主催イベント ({myEvents.length})
        </button>
        <button
          onClick={() => setActiveTab("joined")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "joined"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          参加イベント ({myParticipations.length})
        </button>
      </div>

      <EventTable
        events={activeTab === "organized" ? myEvents : myParticipations}
        emptyMessage={
          activeTab === "organized"
            ? "主催しているイベントはありません"
            : "参加しているイベントはありません"
        }
      />
    </div>
  );
}
