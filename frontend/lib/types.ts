export interface User {
  id: number;
  email?: string | null;
  name: string;
  role: "admin" | "user";
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  start_datetime: string;
  end_datetime?: string | null;
  category: EventCategory;
  max_participants: number;
  location_url?: string | null;
  organizer_id: number;
  organizer_name?: string;
  participant_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: number;
  event_id: number;
  user_id: number;
  user_name?: string;
  joined_at: string;
}

export type EventCategory =
  | "勉強会"
  | "ハッカソン"
  | "LT会"
  | "もくもく会"
  | "その他";

export const EVENT_CATEGORIES: EventCategory[] = [
  "勉強会",
  "ハッカソン",
  "LT会",
  "もくもく会",
  "その他",
];

export interface ListEventsResponse {
  events: Event[];
  total_pages: number;
  page: number;
  total: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
