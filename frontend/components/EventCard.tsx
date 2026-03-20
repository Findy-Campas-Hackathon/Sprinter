import Link from "next/link";
import { CalendarDays, Clock, User, Users } from "lucide-react";
import { Event } from "@/lib/types";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.start_datetime);
  const participantCount = event.participant_count ?? 0;
  const isFull = participantCount >= event.max_participants;
  const fillRate = Math.min(participantCount / event.max_participants, 1);

  return (
    <Link href={`/events/${event.id}`}>
      <div className="group bg-white rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col overflow-hidden border h-90 my-8 border-green-100">

        <div className="bg-green-500 px-7 pt-6 pb-5 flex items-start justify-between gap-3">
          <h3 className="text-white font-bold text-xl leading-snug line-clamp-2 flex-1 drop-shadow-sm">
            {event.title}
          </h3>
          <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
            {event.category && (
              <span className="bg-gray-200/50 text-black text-xs font-bold px-3 py-1 rounded whitespace-nowrap backdrop-blur-sm">
                {event.category}
              </span>
            )}
            {isFull && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                満員
              </span>
            )}
          </div>
        </div>

        <p className="text-black text-sm px-7 pt-5 pb-4 flex-grow line-clamp-3 leading-relaxed">
          {event.description || "説明なし"}
        </p>

        <div className="px-7 pb-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="flex items-center gap-1 text-black font-medium">
              <Users size={12} />
              参加人数
            </span>
            <span className={isFull ? "text-red-500 font-bold" : "text-black font-bold"}>
              {participantCount}
              <span className="text-black font-normal"> / {event.max_participants}人</span>
            </span>
          </div>
          <div className="w-full bg-green-50 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${isFull ? "bg-red-400" : "bg-green-500"}`}
              style={{ width: `${fillRate * 100}%` }}
            />
          </div>
        </div>

        {/* フッター情報 */}
        <div className="px-7 py-4 flex items-center justify-between border-t border-green-50 bg-green-50/40">
          <div className="flex items-center gap-4 text-sm text-black">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-green-500" />
              <span className="font-medium text-black">
                {startDate.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-green-500" />
              <span>
                {startDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-black min-w-0">
            <User size={14} className="text-green-500 shrink-0" />
            <span className="truncate max-w-28 text-black">{event.organizer_name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
