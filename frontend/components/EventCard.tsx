"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Event } from "@/lib/types";
import { Calendar, Users, User as UserIcon } from "lucide-react";

interface EventCardProps {
  event: Event;
}

function getEventStatus(event: Event) {
  const now = new Date();
  const start = new Date(event.start_datetime);
  const end = event.end_datetime ? new Date(event.end_datetime) : null;
  if (start <= now && end && end > now) return "ongoing" as const;
  if (start > now) return "upcoming" as const;
  return "past" as const;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "まもなく終了";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `残り ${h}時間${m}分`;
  if (h > 0) return `残り ${h}時間`;
  return `残り ${m}分`;
}

const categoryColors: Record<string, string> = {
  "勉強会": "bg-blue-50 text-blue-700 ring-blue-200",
  "ハッカソン": "bg-orange-50 text-orange-700 ring-orange-200",
  "LT会": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "もくもく会": "bg-purple-50 text-purple-700 ring-purple-200",
  "その他": "bg-gray-50 text-gray-600 ring-gray-200",
};

export default function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.start_datetime);
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
  const isFull = (event.participant_count ?? 0) >= event.max_participants;
  const status = getEventStatus(event);
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (status !== "ongoing" || !endDate) return;
    const update = () => setRemaining(formatRemaining(endDate.getTime() - Date.now()));
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [status, endDate]);

  const catColor = categoryColors[event.category] || categoryColors["その他"];

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl border transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1 p-6 flex flex-col h-72 ${
          status === "ongoing"
            ? "border-emerald-300 shadow-lg shadow-emerald-500/10"
            : status === "past"
              ? "border-gray-200 opacity-60 hover:opacity-80"
              : "border-gray-100 shadow-sm"
        }`}
      >
        {status === "ongoing" && (
          <div className="absolute -top-px left-6 right-6 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
        )}

        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${catColor}`}>
              {event.category}
            </span>
            {status === "ongoing" && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ring-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                開催中
              </span>
            )}
            {status === "past" && (
              <span className="text-xs text-gray-400 font-medium">終了</span>
            )}
          </div>
          {status === "ongoing" && remaining && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {remaining}
            </span>
          )}
          {isFull && status !== "past" && (
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              満員
            </span>
          )}
        </div>

        <h3 className="text-gray-900 font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">
          {event.title}
        </h3>

        <p className="text-gray-500 text-sm mb-auto line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400" />
            <span>
              {startDate.toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserIcon size={13} className="text-gray-400" />
            <span className="truncate max-w-[80px]">{event.organizer_name}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Users size={13} className="text-gray-400" />
            <span className="font-medium">
              {event.participant_count ?? 0}/{event.max_participants}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
