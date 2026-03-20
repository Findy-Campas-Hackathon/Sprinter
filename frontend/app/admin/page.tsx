"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, events] = await Promise.all([
          adminApi.listUsers(),
          adminApi.listAllEvents(),
        ]);
        setUserCount(users.length);
        setEventCount(events.length);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">統計情報</h2>
      {loading ? (
        <p className="text-gray-400">読み込み中...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">総ユーザー数</p>
            <p className="text-3xl font-bold text-indigo-600">{userCount}</p>
            <Link
              href="/admin/users"
              className="text-sm text-indigo-500 hover:underline mt-2 inline-block"
            >
              ユーザー一覧 →
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">総イベント数</p>
            <p className="text-3xl font-bold text-indigo-600">{eventCount}</p>
            <Link
              href="/admin/events"
              className="text-sm text-indigo-500 hover:underline mt-2 inline-block"
            >
              イベント一覧 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
