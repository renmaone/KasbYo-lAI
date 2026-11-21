"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("9-sinf");
  const [subjects, setSubjects] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          role,
          firstName,
          lastName,
          username: username || undefined,
          email,
          phone: phone || undefined,
          password,
          grade: role === "STUDENT" ? grade : undefined,
          subjects: role === "TEACHER" ? subjects.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        }),
      });
      localStorage.setItem("kasbyol_access_token", res.accessToken);
      localStorage.setItem("kasbyol_user", JSON.stringify(res.user));
      alert(res.message);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Ro‘yxatdan o‘tishda xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0056D2] text-white font-black flex items-center justify-center">K</div>
          <span className="font-black text-lg text-[#0056D2]">KasbYo‘l</span>
        </Link>
        <Link href="/login" className="text-xs font-bold text-[#0056D2] hover:underline">
          Allaqachon hisobingiz bormi? Kirish →
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900">Bepul ro‘yxatdan o‘ting</h1>
            <p className="text-xs text-slate-500 mt-1">
              Sizga avtomatik shaxsiy <strong>KY-ID</strong> va <strong>@username</strong> beriladi
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRole("STUDENT")}
              className={`py-2.5 rounded-lg text-xs font-extrabold transition ${
                role === "STUDENT" ? "bg-white text-[#0056D2] shadow-2xs" : "text-slate-600"
              }`}
            >
              O‘quvchi sifatida
            </button>
            <button
              type="button"
              onClick={() => setRole("TEACHER")}
              className={`py-2.5 rounded-lg text-xs font-extrabold transition ${
                role === "TEACHER" ? "bg-white text-[#0056D2] shadow-2xs" : "text-slate-600"
              }`}
            >
              O‘qituvchi sifatida
            </button>
          </div>

          {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ism *</label>
                <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ozodbek" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Familiya *</label>
                <input required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Hamdamov" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Foydalanuvchi nomi (@username)</label>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                <span className="px-3 text-sm font-black text-[#0056D2]">@</span>
                <input value={username} onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))} placeholder="ozodbek_uz" className="w-full px-2 py-2.5 bg-white text-sm outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Elektron pochta *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
            </div>

            {role === "STUDENT" ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sinf / Kurs</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white">
                  <option value="7-sinf">7-sinf</option>
                  <option value="8-sinf">8-sinf</option>
                  <option value="9-sinf">9-sinf</option>
                  <option value="10-sinf">10-sinf</option>
                  <option value="11-sinf">11-sinf</option>
                  <option value="Talaba / Abituriyent">Talaba / Abituriyent</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">O‘qitadigan faningiz</label>
                <input value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Informatika, Matematika, Fizika" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Parol (kamida 6 ta belgi) *</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kamida 6 ta belgi" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-bold text-sm transition">
              {loading ? "Yaratilmoqda..." : "Ro‘yxatdan o‘tish"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}