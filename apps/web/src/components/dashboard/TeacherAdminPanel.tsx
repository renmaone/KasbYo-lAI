"use client";
import { useState } from "react";

export function TeacherAdminPanel({
  adminStats,
  adminUsers,
  auditLogs,
}: {
  adminStats: any;
  adminUsers: any[];
  auditLogs: any[];
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const filteredUsers = adminUsers.filter((u) => {
    const fullName = `${u.profile?.firstName || ""} ${u.profile?.lastName || ""} ${u.email || ""}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  function exportCsv() {
    const headers = ["Ism", "Familiya", "Email", "Telefon", "Rol"];
    const rows = filteredUsers.map((u) => [
      u.profile?.firstName || "",
      u.profile?.lastName || "",
      u.email || "",
      u.phone || "",
      u.role || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kasbyol_foydalanuvchilar.csv";
    a.click();
  }

  return (
    <div className="space-y-6">
      {adminStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border shadow-xs">
            <div className="text-xs font-bold text-slate-400">O‘QUVCHILAR</div>
            <div className="text-3xl font-extrabold text-[#5A4FE3] mt-1">{adminStats.studentsCount}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-xs">
            <div className="text-xs font-bold text-slate-400">O‘QITUVCHILAR</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">{adminStats.teachersCount}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-xs">
            <div className="text-xs font-bold text-slate-400">FAOL KURSLAR</div>
            <div className="text-3xl font-extrabold text-amber-500 mt-1">{adminStats.coursesCount}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-xs">
            <div className="text-xs font-bold text-slate-400">SINFLAR SONI</div>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">{adminStats.classesCount}</div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Maktab foydalanuvchilari ({filteredUsers.length})</h3>
            <p className="text-xs text-slate-500">O‘quvchilar va o‘qituvchilar ro‘yxatini boshqarish</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism yoki email..."
              className="px-3.5 py-2 rounded-xl border text-xs bg-slate-50 focus:bg-white outline-none"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs font-semibold bg-white"
            >
              <option value="ALL">Barcha rollar</option>
              <option value="STUDENT">O‘quvchilar</option>
              <option value="TEACHER">O‘qituvchilar</option>
              <option value="ADMIN">Adminlar</option>
            </select>
            <button
              onClick={exportCsv}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
            >
              CSV Yuklab olish
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase border-b bg-slate-50/70">
              <tr>
                <th className="py-3 px-3 rounded-tl-xl">F.I.Sh</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Telefon</th>
                <th className="py-3 px-3 rounded-tr-xl">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {u.profile?.firstName} {u.profile?.lastName}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{u.email}</td>
                  <td className="py-3 px-3 text-slate-500">{u.phone || "—"}</td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#5A4FE3] text-xs font-bold">
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-xs">
        <h3 className="font-extrabold text-base text-slate-900 mb-3">Tizim Audit Jurnali (oxirgi harakatlar)</h3>
        <div className="space-y-2 text-xs max-h-64 overflow-y-auto pr-1">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
              <div>
                <span className="font-bold text-[#5A4FE3]">{log.action}</span>
                <span className="text-slate-500 ml-2">· {log.entity}</span>
              </div>
              <span className="text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
