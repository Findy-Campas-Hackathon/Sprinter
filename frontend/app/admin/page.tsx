"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { Users, Calendar, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, events] = await Promise.all([adminApi.listUsers(), adminApi.listAllEvents()]);
        setUserCount(users.length);
        setEventCount(events.length);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-6 group hover:shadow-2xl transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-primary-600" />
          </div>
          <p className="text-sm text-gray-500 font-medium">総ユーザー数</p>
        </div>
        <p className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent mb-3">
          {userCount}
        </p>
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium group-hover:gap-2 transition-all">
          ユーザー一覧 <ArrowRight size={14} />
        </Link>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-6 group hover:shadow-2xl transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
            <Calendar size={20} className="text-violet-600" />
          </div>
          <p className="text-sm text-gray-500 font-medium">総イベント数</p>
        </div>
        <p className="text-4xl font-extrabold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-3">
          {eventCount}
        </p>
        <Link href="/admin/events" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium group-hover:gap-2 transition-all">
          イベント一覧 <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
