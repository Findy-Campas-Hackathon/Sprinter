"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { isAdmin, isLoggedIn } from "@/lib/auth";
import { LayoutDashboard, Calendar, Users } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push("/events"); return; }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard, exact: true },
    { href: "/admin/events", label: "イベント管理", icon: Calendar },
    { href: "/admin/users", label: "ユーザー管理", icon: Users },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">管理ページ</h1>
        <nav className="flex gap-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 w-fit border border-gray-200/50">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "gradient-primary text-white shadow-md shadow-primary-500/25"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/80"
                }`}
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
