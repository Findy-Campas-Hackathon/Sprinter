import Link from "next/link";
import { Event } from "@/lib/types";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.start_datetime);
  const isFull = (event.participant_count ?? 0) >= event.max_participants;

  return (
    <Link href={`/events/${event.id}`}>
      <div className="my-4 group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all p-6 border border-gray-100 cursor-pointer h-80 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded">
            {event.category}
          </span>
          {isFull && (
            <span className="inline-block bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded">
              満員
            </span>
          )}
        </div>
        <h3 className="text-gray-900 font-bold text-2xl mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {event.title}
        </h3>
        <p className="text-gray-600 text-base mb-6 flex-grow line-clamp-4 leading-relaxed">
          {event.description}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 sm:gap-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">開催日:</span>
            <span className="truncate">
              {startDate.toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">主催:</span>
            <span className="truncate">{event.organizer_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">参加人数:</span>
            <span>{event.participant_count ?? 0} / {event.max_participants}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
