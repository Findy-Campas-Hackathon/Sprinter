"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { getAvatarFullUrl } from "@/lib/avatar";
import { getUser } from "@/lib/auth";
import { User } from "@/lib/types";
import { Trash2 } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = getUser();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true); setError("");
    try { const data = await adminApi.listUsers(); setUsers(data ?? []); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "取得に失敗しました"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) { alert("自分自身は削除できません"); return; }
    if (!confirm("このユーザーを削除しますか？")) return;
    try { await adminApi.deleteUser(id); setUsers((prev) => prev.filter((u) => u.id !== id)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "削除に失敗しました"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-5">全ユーザー ({users.length}件)</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">{error}</div>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ユーザー</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">メール</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ロール</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">登録日</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-primary-50/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img src={getAvatarFullUrl(user.avatar_url)} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{user.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="font-medium text-gray-800">{user.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    user.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{new Date(user.created_at).toLocaleDateString("ja-JP")}</td>
                <td className="px-5 py-3.5 text-right">
                  {user.id !== currentUser?.id && (
                    <button onClick={() => handleDelete(user.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center py-10 text-gray-400">ユーザーがいません</p>}
      </div>
    </div>
  );
}
