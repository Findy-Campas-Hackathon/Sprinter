"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getAvatarFullUrl } from "@/lib/avatar";
import { clearAuth, getUser, isAdmin, isLoggedIn } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { User } from "@/lib/types";
import { UserCircle, LogOut, Shield, LayoutDashboard, Calendar, Menu, X } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const logged = isLoggedIn();
    setLoggedIn(logged);
    setUser(getUser());
    setAdmin(isAdmin());

    if (logged) {
      authApi.getMe().catch(() => {
        clearAuth();
        setLoggedIn(false);
        setUser(null);
        setAdmin(false);
      });
    }
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    setLoggedIn(false);
    setUser(null);
    setAdmin(false);
    router.push("/events");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/events" className="flex items-center gap-2 group">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-md shadow-primary-500/25 group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-shadow">
            <span className="text-white font-extrabold text-sm">S</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent">
            Sprinter
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="hidden sm:flex items-center gap-1">
          <Link
            href="/events"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isActive("/events")
                ? "bg-primary-50 text-primary-700"
                : "text-gray-600 hover:text-primary-700 hover:bg-primary-50/50"
            }`}
          >
            <Calendar size={15} />
            イベント
          </Link>

          {loggedIn ? (
            <>
              <Link
                href="/mypage"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/mypage")
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:text-primary-700 hover:bg-primary-50/50"
                }`}
              >
                <LayoutDashboard size={15} />
                マイページ
              </Link>
              {admin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    pathname.startsWith("/admin")
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:text-primary-700 hover:bg-primary-50/50"
                  }`}
                >
                  <Shield size={15} />
                  管理
                </Link>
              )}

              <div className="w-px h-6 bg-gray-200 mx-2" />

              <div className="flex items-center gap-2 pl-1">
                {user?.avatar_url ? (
                  <img
                    src={getAvatarFullUrl(user.avatar_url)}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-primary-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user?.name?.charAt(0) || <UserCircle size={14} />}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {user?.name}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="ログアウト"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-700 rounded-lg transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="gradient-primary text-white text-sm font-medium px-4 py-1.5 rounded-lg shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 transition-all"
              >
                新規登録
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg px-4 py-3 space-y-1 animate-fade-in">
          <Link href="/events" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50">
            イベント
          </Link>
          {loggedIn ? (
            <>
              <Link href="/mypage" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50">
                マイページ
              </Link>
              {admin && (
                <Link href="/admin" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50">
                  管理
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50">
                ログイン
              </Link>
              <Link href="/register" className="block px-3 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50">
                新規登録
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
