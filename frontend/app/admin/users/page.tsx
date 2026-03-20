"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { User } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = getUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listUsers();
      setUsers(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      alert("自分自身は削除できません");
      return;
    }
    if (!confirm("このユーザーを削除しますか？")) return;
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  if (loading) {
    return <p className="text-gray-400">読み込み中...</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        全ユーザー ({users.length}件)
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">ID</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">名前</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">メール</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">ロール</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">登録日</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{user.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(user.created_at).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-4 py-3">
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      削除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-center py-8 text-gray-400">ユーザーがいません</p>
        )}
      </div>
    </div>
  );
}
