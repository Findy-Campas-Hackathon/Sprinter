"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, eventsApi } from "@/lib/api";
import { Event } from "@/lib/types";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listAllEvents();
      setEvents(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("このイベントを削除しますか？")) return;
    try {
      await eventsApi.delete(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  if (loading) {
    return <p className="text-gray-400">読み込み中...</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        全イベント ({events.length}件)
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">ID</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">タイトル</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">カテゴリ</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">主催者</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">参加者</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">開始日時</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{event.id}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/events/${event.id}`}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    {event.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{event.category}</td>
                <td className="px-4 py-3 text-gray-600">{event.organizer_name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {event.participant_count ?? 0} / {event.max_participants}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(event.start_datetime).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="text-center py-8 text-gray-400">イベントがありません</p>
        )}
      </div>
    </div>
  );
}
