"use client";

import { useEffect, useRef, useState } from "react";
import EventCard from "@/components/EventCard";
import Pagination from "@/components/Pagination";
import { eventsApi } from "@/lib/api";
import { EVENT_CATEGORIES, Event, EventCategory } from "@/lib/types";
import { ChevronDown, Plus } from 'lucide-react';
import Link from "next/link";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState<EventCategory | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            {category === "" ? "すべてのカテゴリー" : category}
            <ChevronDown
              size={16}
              className={`ml-1 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden z-10">
              {[{ label: "すべてのカテゴリー", value: "" as const }, ...EVENT_CATEGORIES.map((c) => ({ label: c, value: c }))].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => { handleCategoryChange(value); setDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                    category === value
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
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
          <div>
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
