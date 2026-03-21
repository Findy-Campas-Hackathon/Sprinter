"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import EventCard from "@/components/EventCard";
import { authApi, userApi } from "@/lib/api";
import { getAvatarFullUrl } from "@/lib/avatar";
import { getUser, isLoggedIn, setUser } from "@/lib/auth";
import { Event, User } from "@/lib/types";
import { UserCircle, Camera } from "lucide-react";

export default function MyPage() {
  const router = useRouter();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [myParticipations, setMyParticipations] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"organized" | "joined">("organized");
  const [me, setMe] = useState<User | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    const current = getUser();
    setMe(current);
    setProfileName(current?.name ?? "");
    setProfileAvatarUrl(current?.avatar_url ?? "");
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const [events, participations] = await Promise.all([userApi.myEvents(), userApi.myParticipations()]);
      setMyEvents(events ?? []);
      setMyParticipations(participations ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally { setLoading(false); }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) { setProfileSaveError("JPEG, PNG, GIF, WebP のみアップロードできます"); return; }
    if (file.size > 5 * 1024 * 1024) { setProfileSaveError("ファイルサイズは5MB以下にしてください"); return; }
    setAvatarFile(file); setProfileSaveError("");
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true); setProfileSaveError("");
    try {
      const updated = await authApi.uploadAvatar(avatarFile);
      setUser(updated); setMe(updated); setProfileAvatarUrl(updated.avatar_url ?? "");
      setAvatarFile(null); setAvatarPreview(null);
    } catch (err: unknown) {
      setProfileSaveError(err instanceof Error ? err.message : "アバターのアップロードに失敗しました");
    } finally { setUploadingAvatar(false); }
  };

  const handleSaveProfile = async () => {
    const name = profileName.trim();
    if (!name) { setProfileSaveError("名前を入力してください"); return; }
    setProfileSaveError(""); setSavingProfile(true);
    try {
      if (avatarFile) await handleUploadAvatar();
      const updated = await authApi.updateMe({ name, avatar_url: profileAvatarUrl.trim() || undefined });
      setUser(updated); setMe(updated); setProfileName(updated.name); setProfileAvatarUrl(updated.avatar_url ?? "");
    } catch (err: unknown) {
      setProfileSaveError(err instanceof Error ? err.message : "プロフィール更新に失敗しました");
    } finally { setSavingProfile(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const activeEvents = activeTab === "organized" ? myEvents : myParticipations;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">マイページ</h1>
        <p className="text-gray-500 text-sm mt-1">{me?.name} さん</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">{error}</div>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-5">プロフィール設定</h2>
        <div className="flex flex-col sm:flex-row gap-8">
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-violet-100 cursor-pointer group shadow-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview || profileAvatarUrl ? (
                <img
                  src={avatarPreview || getAvatarFullUrl(profileAvatarUrl)}
                  alt="アバター"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-400">
                  <UserCircle size={56} strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarSelect} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
              画像を変更
            </button>
            {avatarFile && (
              <div className="flex gap-2">
                <button type="button" onClick={handleUploadAvatar} disabled={uploadingAvatar}
                  className="text-xs gradient-primary text-white px-3 py-1.5 rounded-lg shadow-sm disabled:opacity-50 transition-all">
                  {uploadingAvatar ? "送信中..." : "アップロード"}
                </button>
                <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5">
                  取消
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP（5MB以下）</p>
          </div>

          <div className="flex-1 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">名前</label>
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                placeholder="山田 太郎" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">メールアドレス</label>
              <p className="text-sm text-gray-500 px-4 py-2.5 bg-gray-50/50 rounded-xl border border-gray-100">{me?.email ?? "未設定"}</p>
            </div>

            {profileSaveError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{profileSaveError}</div>
            )}

            <button type="button" onClick={handleSaveProfile} disabled={savingProfile}
              className="gradient-primary text-white font-semibold py-2.5 px-6 rounded-xl shadow-md shadow-primary-500/25 hover:shadow-lg disabled:opacity-50 transition-all">
              {savingProfile ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 mb-6 w-fit border border-gray-200/50">
        <button
          onClick={() => setActiveTab("organized")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "organized"
              ? "gradient-primary text-white shadow-md shadow-primary-500/25"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/80"
          }`}
        >
          主催イベント ({myEvents.length})
        </button>
        <button
          onClick={() => setActiveTab("joined")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "joined"
              ? "gradient-primary text-white shadow-md shadow-primary-500/25"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/80"
          }`}
        >
          参加イベント ({myParticipations.length})
        </button>
      </div>

      {activeEvents.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {activeTab === "organized" ? "主催しているイベントはありません" : "参加しているイベントはありません"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
