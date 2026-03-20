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
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 border border-gray-100 cursor-pointer h-full flex flex-col">
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
        <h3 className="text-gray-900 font-semibold text-lg mb-2 line-clamp-2">
          {event.title}
        </h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-grow">
          {event.description}
        </p>
        <div className="text-xs text-gray-500 space-y-1">
          <div>
            <span className="font-medium">開催日: </span>
            {startDate.toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div>
            <span className="font-medium">主催: </span>
            {event.organizer_name}
          </div>
          <div>
            <span className="font-medium">参加者: </span>
            {event.participant_count ?? 0} / {event.max_participants}
          </div>
        </div>
      </div>
    </Link>
  );
}
