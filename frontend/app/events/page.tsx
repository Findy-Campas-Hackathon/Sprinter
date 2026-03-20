"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import Pagination from "@/components/Pagination";
import { eventsApi } from "@/lib/api";
import { EVENT_CATEGORIES, Event, EventCategory } from "@/lib/types";
import { Plus } from 'lucide-react';
import Link from "next/link";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState<EventCategory | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category]);

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await eventsApi.list(page, category || undefined);
      setEvents(res.events ?? []);
      setTotalPages(res.total_pages);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "イベントの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat: EventCategory | "") => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">イベント一覧</h1>
          <p className="text-gray-500 text-sm mt-1">全 {total} 件</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange("")}
            className={`px-3 py-1 rounded-full text-sm border ${
              category === ""
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            すべて
          </button>
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1 rounded-full text-sm border ${
                category === cat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="text-gray-400">読み込み中...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-4 text-sm">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          イベントがありません
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <Link
        href="/events/new"
        title="イベントを作成"
        aria-label="Create new event"
        className="fixed bottom-10 right-10 bg-blue-500 hover:bg-blue-500/80 duration-300 text-white p-4 rounded-lg z-50 flex items-center justify-center group"
      >
        <Plus size={28} className="transition-all" />
      </Link>
    </div>
  );
}
