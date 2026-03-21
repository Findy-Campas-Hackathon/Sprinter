"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, eventsApi } from "@/lib/api";
import { Event } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true); setError("");
    try { const data = await adminApi.listAllEvents(); setEvents(data ?? []); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "取得に失敗しました"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("このイベントを削除しますか？")) return;
    try { await eventsApi.delete(id); setEvents((prev) => prev.filter((e) => e.id !== id)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "削除に失敗しました"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-5">全イベント ({events.length}件)</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">{error}</div>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">タイトル</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">カテゴリ</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">主催者</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">参加者</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">開始日時</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-primary-50/30 transition-colors">
                <td className="px-5 py-3.5">
                  <Link href={`/events/${event.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                    {event.title}
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-block bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {event.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{event.organizer_name}</td>
                <td className="px-5 py-3.5 text-gray-500">
                  {event.participant_count ?? 0} / {event.max_participants}
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  {new Date(event.start_datetime).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/events/${event.id}/edit`} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                      <Pencil size={15} />
                    </Link>
                    <button onClick={() => handleDelete(event.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && <p className="text-center py-10 text-gray-400">イベントがありません</p>}
      </div>
    </div>
  );
}
