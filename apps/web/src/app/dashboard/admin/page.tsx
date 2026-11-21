"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function SuperAdminPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAdmin() {
    try {
      const res = await apiFetch("/admin/overview");
      setData(res);
    } catch {
      alert("Sizda Super Admin huquqi mavjud emas!");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmin();
  }, []);

  async function handleUpdateUser(id: string, payload: { verified?: boolean; role?: string }) {
    try {
      await apiFetch(`/admin/users/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await loadAdmin();
    } catch (err: any) {
      alert(err.message || "Xatolik");
    }
  }

  if (loading || !data) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-bold text-slate-500">Super Admin paneli yuklanmoqda...</div>;
  }

  const filteredUsers = (data.users || []).filter((u: any) => {
    const q = search.toLowerCase();
    const full = `${u.profile?.firstName || ""} ${u.profile?.lastName || ""} ${u.email} ${u.publicId} ${u.username}`.toLowerCase();
    return full.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">
            \u2190 Kabinetga
          </Link>
          <div>
            <span className="text-[11px] font-extrabold uppercase text-[#0056D2]">KasbYo\u2018l Boshqaruv Markazi</span>
            <h1 className="text-lg font-black text-slate-900">Super Admin Nazorat Paneli</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border">
            <div className="text-xs text-slate-500">Jami foydalanuvchilar</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{data.stats.totalUsers}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border">
            <div className="text-xs text-slate-500">O\u2018quvchilar</div>
            <div className="text-2xl font-black text-[#0056D2] mt-1">{data.stats.students}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border">
            <div className="text-xs text-slate-500">O\u2018qituvchilar</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{data.stats.teachers}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border">
            <div className="text-xs text-slate-500">Yaratilgan sinflar</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{data.stats.courses}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border">
            <div className="text-xs text-slate-500">Jami darslar</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{data.stats.lessons}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-black text-base">Foydalanuvchilar va hujjatlarni tasdiqlash</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism, KY-ID, @username yoki email qidirish..."
              className="px-4 py-2 rounded-xl border text-xs w-72 outline-none focus:border-[#0056D2]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b text-slate-400 uppercase text-[11px]">
                  <th className="py-3 px-2">ID / Username</th>
                  <th className="py-3 px-2">F.I.SH & Email</th>
                  <th className="py-3 px-2">Rol</th>
                  <th className="py-3 px-2">Hujjat (Guvohnoma/Diplom)</th>
                  <th className="py-3 px-2">Holati</th>
                  <th className="py-3 px-2 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-2 font-bold text-[#0056D2]">
                      {u.publicId}<div className="text-[11px] text-slate-400">@{u.username}</div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">{u.profile?.firstName} {u.profile?.lastName}</div>
                      <div className="text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                        className="px-2.5 py-1 rounded-lg border bg-white font-bold text-xs"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="TEACHER">TEACHER</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      {u.profile?.documentUrl ? (
                        <a href={u.profile.documentUrl} target="_blank" rel="noreferrer" className="text-[#0056D2] font-bold underline">
                          Hujjatni ko\u2018rish
                        </a>
                      ) : (
                        <span className="text-slate-400">Yuklanmagan</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {u.verified ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">Tasdiqlangan</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">Kutilmoqda</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleUpdateUser(u.id, { verified: !u.verified })}
                        className={`px-3 py-1.5 rounded-lg font-bold text-white ${u.verified ? "bg-slate-500 hover:bg-slate-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
                      >
                        {u.verified ? "Bekor qilish" : "Tasdiqlash"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
