"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, getUser, isAdmin, isLoggedIn } from "@/lib/auth";
import { User } from "@/lib/types";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUser(getUser());
    setAdmin(isAdmin());
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    setLoggedIn(false);
    setUser(null);
    setAdmin(false);
    router.push("/events");
  };

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/events" className="text-xl font-bold tracking-tight hover:text-indigo-200">
          Sprinter
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/events" className="hover:text-indigo-200 text-sm">
            イベント一覧
          </Link>
          {loggedIn ? (
            <>
              <Link href="/events/new" className="hover:text-indigo-200 text-sm">
                イベント作成
              </Link>
              <Link href="/mypage" className="hover:text-indigo-200 text-sm">
                マイページ
              </Link>
              {admin && (
                <Link href="/admin" className="hover:text-indigo-200 text-sm">
                  管理
                </Link>
              )}
              <span className="text-indigo-200 text-sm">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-indigo-500 hover:bg-indigo-400 text-white text-sm px-3 py-1 rounded"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-indigo-200 text-sm">
                ログイン
              </Link>
              <Link
                href="/register"
                className="bg-white text-indigo-700 hover:bg-indigo-100 text-sm px-3 py-1 rounded font-medium"
              >
                新規登録
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
