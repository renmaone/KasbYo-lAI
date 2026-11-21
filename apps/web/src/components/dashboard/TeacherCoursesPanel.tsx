"use client";
import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export function TeacherCoursesPanel({
  courses,
  onRefresh,
}: {
  courses: any[];
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Har bir kurs uchun ID kiritish inputi
  const [studentIdInputs, setStudentIdInputs] = useState<Record<string, string>>({});
  const [addingCourseId, setAddingCourseId] = useState<string | null>(null);

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      await apiFetch("/courses", {
        method: "POST",
        body: JSON.stringify({ title, description: description || "Kasbiy yo‘naltirish va amaliy darslar", isPublic: false }),
      });
      setTitle("");
      setDescription("");
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleAddStudentById(courseId: string) {
    const publicId = studentIdInputs[courseId];
    if (!publicId?.trim()) return;
    setAddingCourseId(courseId);
    try {
      const res = await apiFetch(`/courses/${courseId}/enroll-by-id`, {
        method: "POST",
        body: JSON.stringify({ publicId }),
      });
      alert(res.message);
      setStudentIdInputs((prev) => ({ ...prev, [courseId]: "" }));
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingCourseId(null);
    }
  }

  async function handleRemoveStudent(courseId: string, studentId: string) {
    if (!confirm("O‘quvchini ushbu darsdan chiqarasizmi?")) return;
    try {
      await apiFetch(`/courses/${courseId}/students/${studentId}`, { method: "DELETE" });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Yangi dars/guruh yaratish */}
      <form onSubmit={handleCreateCourse} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Yangi dars / guruh yaratish</h3>
          <p className="text-xs text-slate-500">Dars yarating va o‘quvchilarni shaxsiy ID raqami orqali qo‘shing</p>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dars nomi (masalan: 9-A Informatika)"
            className="px-4 py-2.5 rounded-xl border text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qisqacha tavsif..."
            className="px-4 py-2.5 rounded-xl border text-sm"
          />
          <button
            type="submit"
            disabled={creating}
            className="px-5 py-2.5 rounded-xl bg-[#5A4FE3] hover:bg-[#4338CA] text-white font-bold text-sm transition"
          >
            {creating ? "Yaratilmoqda..." : "+ Yangi dars yaratish"}
          </button>
        </div>
      </form>

      {/* Mavjud darslar va ularga ID orqali o'quvchi qo'shish */}
      <div className="space-y-5">
        {courses.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5A4FE3] text-xs font-bold">
                  Dars guruhi · {c.enrollments?.length || 0} ta o‘quvchi
                </span>
                <h4 className="text-xl font-extrabold text-slate-900 mt-1">{c.title}</h4>
                <p className="text-xs text-slate-500">{c.description}</p>
              </div>

              {/* ID orqali o'quvchi qo'shish */}
              <div className="flex gap-2 shrink-0">
                <input
                  value={studentIdInputs[c.id] || ""}
                  onChange={(e) => setStudentIdInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  placeholder="O‘quvchi ID (KY-1001)"
                  className="px-3.5 py-2.5 rounded-xl border text-xs font-bold uppercase w-44"
                />
                <button
                  type="button"
                  disabled={addingCourseId === c.id}
                  onClick={() => handleAddStudentById(c.id)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                >
                  {addingCourseId === c.id ? "Qo‘shilmoqda..." : "+ ID bilan qo‘shish"}
                </button>
              </div>
            </div>

            {/* Ushbu darsga biriktirilgan o'quvchilar va ularning shaxsiy ma'lumotlari */}
            {c.enrollments && c.enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-400 uppercase border-b bg-slate-50">
                    <tr>
                      <th className="py-2.5 px-3">Unikal ID</th>
                      <th className="py-2.5 px-3">O‘quvchi F.I.Sh</th>
                      <th className="py-2.5 px-3">Telefon (Tasdiqlangan)</th>
                      <th className="py-2.5 px-3">Sinf / Hudud</th>
                      <th className="py-2.5 px-3">RIASEC Kodi</th>
                      <th className="py-2.5 px-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {c.enrollments.map((enr: any) => {
                      const st = enr.student;
                      const topCode = st?.interestResults?.[0]?.topCode || "Topshirmagan";
                      return (
                        <tr key={enr.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-black text-[#5A4FE3]">{st?.publicId || "—"}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {st?.profile?.firstName} {st?.profile?.lastName}
                            <div className="text-[11px] font-normal text-slate-400">{st?.email}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            {st?.phone ? (
                              <span className="font-semibold text-slate-700">
                                {st.phone} {st.phoneVerified ? "✅" : "⏳"}
                              </span>
                            ) : (
                              <span className="text-slate-400">Kiritilmagan</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {st?.studentProfile?.grade || "—"} · {st?.profile?.region || st?.studentProfile?.region || "—"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#5A4FE3] font-extrabold">
                              {topCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleRemoveStudent(c.id, st.id)}
                              className="text-rose-500 hover:underline font-bold"
                            >
                              Chiqarish
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3">
                Hali bu darsga o‘quvchi qo‘shilmagan. O‘quvchidan shaxsiy <strong>KY-XXXX</strong> ID raqamini olib yuqoridagi maydonga kiriting.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
