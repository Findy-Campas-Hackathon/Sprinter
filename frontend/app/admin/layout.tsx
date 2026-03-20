"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { isAdmin, isLoggedIn } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) {
      router.push("/events");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-400">
        確認中...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">管理ページ</h1>
        <nav className="flex gap-4 border-b pb-2">
          <Link
            href="/admin"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ダッシュボード
          </Link>
          <Link
            href="/admin/events"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            イベント管理
          </Link>
          <Link
            href="/admin/users"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ユーザー管理
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
