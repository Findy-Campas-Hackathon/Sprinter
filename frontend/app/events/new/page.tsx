"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { eventsApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { EVENT_CATEGORIES, EventCategory } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDatetime, setStartDatetime] = useState("");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [category, setCategory] = useState<EventCategory>("勉強会");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) router.push("/login");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const start = new Date(startDatetime);
      const end = new Date(start);
      end.setHours(end.getHours() + durationHours);
      const event = await eventsApi.create({
        title,
        description,
        start_datetime: new Date(startDatetime).toISOString(),
        end_datetime: end.toISOString(),
        category,
        max_participants: maxParticipants,
      });
      router.push(`/events/${event.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "イベントの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft size={16} />
        イベント一覧へ戻る
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">イベントを作成</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} className={inputClass} placeholder="イベントタイトル" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value as EventCategory)} className={inputClass}>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              概要 <span className="text-red-500">*</span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className={inputClass} placeholder="イベントの説明を入力してください" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                開始日時 <span className="text-red-500">*</span>
              </label>
              <input type="datetime-local" value={startDatetime} onChange={(e) => setStartDatetime(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                所要時間（時間） <span className="text-red-500">*</span>
              </label>
              <input type="number" value={durationHours} onChange={(e) => setDurationHours(parseInt(e.target.value || "0", 10))} required min={1} max={12} className={inputClass} />
              <p className="text-xs text-gray-400 mt-1.5">最大12時間まで</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              定員 <span className="text-red-500">*</span>
            </label>
            <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(parseInt(e.target.value))} required min={1} max={100} className={inputClass} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition-colors">
              キャンセル
            </button>
            <button type="submit" disabled={loading} className="flex-1 gradient-primary text-white font-semibold py-2.5 rounded-xl shadow-md shadow-primary-500/25 hover:shadow-lg disabled:opacity-50 transition-all">
              {loading ? "作成中..." : "作成する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
