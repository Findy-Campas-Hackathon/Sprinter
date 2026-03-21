"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import { User, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizeLoginError = (raw: string) => {
    const msg = raw.toLowerCase();
    if (msg.includes("invalid credentials")) {
      return "メールアドレス（またはユーザー名）かパスワードが違います";
    }
    if (msg.includes("invalid request body")) {
      return "入力内容を確認してください";
    }
    if (msg.includes("unauthorized") || msg.includes("failed to login")) {
      return "ログインに失敗しました。もう一度お試しください";
    }
    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(identifier, password);
      setToken(res.token);
      setUser(res.user);
      router.push("/events");
      router.refresh();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "ログインに失敗しました";
      setError(normalizeLoginError(raw));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
            <span className="text-white font-extrabold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">おかえりなさい</h1>
          <p className="text-gray-500 text-sm mt-1">アカウントにログイン</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                メールアドレス または ユーザー名
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  placeholder="example@email.com または ユーザー名"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                パスワード
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  placeholder="パスワード"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white font-semibold py-2.5 rounded-xl shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 transition-all"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          アカウントをお持ちでない方は{" "}
          <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
