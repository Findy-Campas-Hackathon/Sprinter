"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import { userApi } from "@/lib/api";
import { getUser, isLoggedIn } from "@/lib/auth";
import { Event } from "@/lib/types";

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

      {activeTab === "organized" && (
        <>
          {myEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              主催しているイベントはありません
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "joined" && (
        <>
          {myParticipations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              参加しているイベントはありません
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myParticipations.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
