import { clearAuth, getToken } from "./auth";
import {
  AuthResponse,
  Event,
  ListEventsResponse,
  Message,
  Participant,
  User,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    const isAuthLoginOrRegister =
      path.startsWith("/auth/login") || path.startsWith("/auth/register");
    if (res.status === 401 && token && !isAuthLoginOrRegister) {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw new Error(errorData.message || `HTTP error ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

// Auth
export const authApi = {
  register: (email: string | undefined, password: string, name: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: email || "", password, name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<User>("/auth/me"),
  updateMe: (data: { name: string; avatar_url?: string }) =>
    request<User>("/auth/me", {
      method: "PUT",
      body: JSON.stringify({
        name: data.name,
        avatar_url: data.avatar_url ? data.avatar_url : "",
      }),
    }),

  uploadAvatar: async (file: File): Promise<User> => {
    const token = getToken();
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch(`${API_BASE}/auth/me/avatar`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || `HTTP error ${res.status}`);
    }

    return res.json() as Promise<User>;
  },
};

// Events
export const eventsApi = {
  list: (page = 1, category?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set("category", category);
    return request<ListEventsResponse>(`/events?${params.toString()}`);
  },

  get: (id: number) => request<Event>(`/events/${id}`),

  create: (data: {
    title: string;
    description: string;
    start_datetime: string;
    end_datetime?: string;
    category: string;
    max_participants: number;
  }) =>
    request<Event>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: {
      title: string;
      description: string;
      start_datetime: string;
      end_datetime?: string;
      category: string;
      max_participants: number;
    }
  ) =>
    request<Event>(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/events/${id}`, { method: "DELETE" }),

  listParticipants: (id: number) =>
    request<Participant[]>(`/events/${id}/participants`),

  join: (id: number) =>
    request<Participant>(`/events/${id}/participants`, { method: "POST" }),

  cancelParticipation: (id: number) =>
    request<void>(`/events/${id}/participants`, { method: "DELETE" }),
};

// Messages
export const messagesApi = {
  list: (eventId: number, sinceId?: number) => {
    const params = new URLSearchParams();
    if (sinceId) params.set("since_id", String(sinceId));
    const qs = params.toString();
    return request<Message[]>(`/events/${eventId}/messages${qs ? `?${qs}` : ""}`);
  },

  send: (eventId: number, content: string) =>
    request<Message>(`/events/${eventId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};

// User
export const userApi = {
  myEvents: () => request<Event[]>("/users/me/events"),
  myParticipations: () => request<Event[]>("/users/me/participations"),
};

// Admin
export const adminApi = {
  listUsers: () => request<User[]>("/admin/users"),
  deleteUser: (id: number) =>
    request<void>(`/admin/users/${id}`, { method: "DELETE" }),
  listAllEvents: () => request<Event[]>("/admin/events"),
};
