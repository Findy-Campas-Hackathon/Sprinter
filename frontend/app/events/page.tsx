"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import Pagination from "@/components/Pagination";
import { eventsApi, userApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { EVENT_CATEGORIES, Event, EventCategory } from "@/lib/types";
import { Plus, Search, ListFilter, CalendarCheck, History } from "lucide-react";
import Link from "next/link";

type ViewMode = "all" | "joining" | "past_joined";

function getEventStatus(event: Event): "ongoing" | "upcoming" | "past" {
  const now = new Date();
  const start = new Date(event.start_datetime);
  const end = event.end_datetime ? new Date(event.end_datetime) : null;
  if (start <= now && end && end > now) return "ongoing";
  if (start > now) return "upcoming";
  return "past";
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState<EventCategory | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [myParticipations, setMyParticipations] = useState<Event[]>([]);
  const [participationsLoaded, setParticipationsLoaded] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  useEffect(() => {
    if (viewMode === "all") {
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, viewMode]);

  useEffect(() => {
    if ((viewMode === "joining" || viewMode === "past_joined") && !participationsLoaded) {
      fetchMyParticipations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const sortEvents = (list: Event[]): Event[] => {
    const now = new Date();
    const getOrder = (e: Event) => {
      const start = new Date(e.start_datetime);
      const end = e.end_datetime ? new Date(e.end_datetime) : null;
      if (start <= now && end && end > now) return 0;
      if (start > now) return 1;
      return 2;
    };
    return [...list].sort((a, b) => {
      const oa = getOrder(a);
      const ob = getOrder(b);
      if (oa !== ob) return oa - ob;
      if (oa === 0) {
        const endA = a.end_datetime ? new Date(a.end_datetime).getTime() : Infinity;
        const endB = b.end_datetime ? new Date(b.end_datetime).getTime() : Infinity;
        return endA - endB;
      }
      if (oa === 1) return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
      return new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime();
    });
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await eventsApi.list(page, category || undefined);
      setEvents(sortEvents(res.events ?? []));
      setTotalPages(res.total_pages);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "イベントの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyParticipations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userApi.myParticipations();
      setMyParticipations(data ?? []);
      setParticipationsLoaded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "参加イベントの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat: EventCategory | "") => {
    setCategory(cat);
    setPage(1);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setPage(1);
  };

  const getFilteredEvents = (): Event[] => {
    if (viewMode === "all") return events;

    let filtered = myParticipations;

    if (category) {
      filtered = filtered.filter((e) => e.category === category);
    }

    if (viewMode === "joining") {
      filtered = filtered.filter((e) => {
        const status = getEventStatus(e);
        return status === "ongoing" || status === "upcoming";
      });
    } else if (viewMode === "past_joined") {
      filtered = filtered.filter((e) => getEventStatus(e) === "past");
    }

    return sortEvents(filtered);
  };

  const displayEvents = getFilteredEvents();
  const displayTotal = viewMode === "all" ? total : displayEvents.length;

  const viewModeLabel: Record<ViewMode, string> = {
    all: "すべてのイベント",
    joining: "参加中・参加予定のイベント",
    past_joined: "過去に参加したイベント",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            イベント
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {viewMode !== "all" && <span className="text-primary-600 font-medium">{viewModeLabel[viewMode]} — </span>}
            <span className="font-semibold text-primary-600">{displayTotal}</span> 件
          </p>
        </div>
      </div>

      {loggedIn && (
        <div className="flex gap-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 mb-6 w-fit border border-gray-200/50">
          <button
            onClick={() => handleViewModeChange("all")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "all"
                ? "gradient-primary text-white shadow-md shadow-primary-500/25"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/80"
            }`}
          >
            <ListFilter size={15} />
            すべて
          </button>
          <button
            onClick={() => handleViewModeChange("joining")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "joining"
                ? "gradient-primary text-white shadow-md shadow-primary-500/25"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/80"
            }`}
          >
            <CalendarCheck size={15} />
            参加中
          </button>
          <button
            onClick={() => handleViewModeChange("past_joined")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "past_joined"
                ? "gradient-primary text-white shadow-md shadow-primary-500/25"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/80"
            }`}
          >
            <History size={15} />
            過去参加
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => handleCategoryChange("")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            category === ""
              ? "gradient-primary text-white shadow-md shadow-primary-500/25"
              : "bg-white/80 text-gray-600 hover:bg-white hover:shadow-sm border border-gray-200"
          }`}
        >
          すべて
        </button>
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              category === cat
                ? "gradient-primary text-white shadow-md shadow-primary-500/25"
                : "bg-white/80 text-gray-600 hover:bg-white hover:shadow-sm border border-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">読み込み中...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
          {error}
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Search size={40} className="text-gray-300" />
          <p className="text-gray-400">
            {viewMode === "joining"
              ? "参加中・参加予定のイベントはありません"
              : viewMode === "past_joined"
                ? "過去に参加したイベントはありません"
                : "イベントが見つかりませんでした"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {viewMode === "all" && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      <Link
        href="/events/new"
        title="イベントを作成"
        className="fixed bottom-8 right-8 gradient-primary text-white p-4 rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 transition-all duration-200 z-50 flex items-center gap-2 group"
      >
        <Plus size={22} />
        <span className="text-sm font-medium hidden sm:inline">新規作成</span>
      </Link>
    </div>
  );
}
