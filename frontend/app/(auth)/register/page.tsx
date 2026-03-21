"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import { User, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(email || undefined, password, name);
      setToken(res.token);
      setUser(res.user);
      router.push("/events");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
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
          <h1 className="text-2xl font-bold text-gray-900">アカウント作成</h1>
          <p className="text-gray-500 text-sm mt-1">Sprinter に参加しよう</p>
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
                名前 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  placeholder="山田 太郎"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                メールアドレス
                <span className="text-gray-400 text-xs ml-1">（任意）</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  placeholder="example@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                パスワード <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  placeholder="6文字以上"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                パスワード（確認） <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={6}
                  className={`w-full border rounded-xl pl-10 pr-3 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all ${
                    passwordConfirm && password !== passwordConfirm
                      ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-primary-400"
                  }`}
                  placeholder="パスワードをもう一度入力"
                />
              </div>
              {passwordConfirm && password !== passwordConfirm && (
                <p className="text-red-500 text-xs mt-1.5">パスワードが一致しません</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white font-semibold py-2.5 rounded-xl shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 transition-all"
            >
              {loading ? "登録中..." : "登録する"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
