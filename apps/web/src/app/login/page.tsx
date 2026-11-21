"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [roleForGoogle, setRoleForGoogle] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleRedirecting, setGoogleRedirecting] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userParam = params.get("user");
    const errParam = params.get("error");

    if (errParam) {
      setError(errParam);
      window.history.replaceState(null, "", "/login");
      return;
    }

    if (token && userParam) {
      try {
        localStorage.setItem("kasbyol_access_token", token);
        localStorage.setItem("kasbyol_user", userParam);
        router.push("/dashboard");
      } catch {
        setError("Sessiyani saqlashda xatolik");
      }
    }
  }, [router]);

  function handleContinueWithGoogle() {
    setError("");
    setGoogleRedirecting(true);
    window.location.href = `${apiBase}/auth/google/start?role=${roleForGoogle}`;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("kasbyol_access_token", res.accessToken);
      localStorage.setItem("kasbyol_user", JSON.stringify(res.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login yoki parol noto‘g‘ri");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white grid lg:grid-cols-12">
      {/* Chap ustun: Coursera uslubidagi zamonaviy brend paneli */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#0056D2] via-[#00419E] to-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white text-[#0056D2] font-black text-xl flex items-center justify-center shadow-md">
              K
            </div>
            <span className="font-black text-2xl tracking-tight">KasbYo‘l</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
            ✨ O‘zbekistonning raqamli ta’lim va kasb ekotizimi
          </div>
          <h2 className="text-4xl font-black leading-tight">
            Kelajak kasbingizni ilmiy asosda tanlang
          </h2>
          <p className="text-sm text-blue-100 leading-relaxed">
            O‘qituvchilaringiz yaratgan sinflarga shaxsiy <strong>KY-ID</strong> orqali qo‘shiling, RIASEC diagnostikasidan o‘ting va AI Murabbiy bilan rivojlaning.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <div className="text-xl font-black">KY-ID</div>
              <div className="text-xs text-blue-100 mt-0.5">Shaxsiy raqamli pasport</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <div className="text-xl font-black">AI Murabbiy</div>
              <div className="text-xs text-blue-100 mt-0.5">24/7 karyera maslahatchi</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-200/80">
          © 2026 KasbYo‘l Education Platform. Barcha huquqlar himoyalangan.
        </div>
      </div>

      {/* O'ng ustun: Kirish formasi */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 bg-[#F8FAFC]">
        <div className="flex justify-between items-center max-w-md w-full mx-auto">
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0056D2] text-white font-black flex items-center justify-center">K</div>
            <span className="font-black text-lg text-[#0056D2]">KasbYo‘l</span>
          </Link>
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 ml-auto">
            ← Bosh sahifaga
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/70 p-7 sm:p-9 space-y-5 my-auto">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Tizimga kirish</h1>
            <p className="text-xs text-slate-500 mt-1">
              O‘qishni davom ettirish yoki sinflaringizni boshqarish uchun kiring
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRoleForGoogle("STUDENT")}
              className={`py-2 rounded-lg text-xs font-extrabold transition ${
                roleForGoogle === "STUDENT" ? "bg-white text-[#0056D2] shadow-2xs" : "text-slate-600"
              }`}
            >
              O‘quvchiman
            </button>
            <button
              type="button"
              onClick={() => setRoleForGoogle("TEACHER")}
              className={`py-2 rounded-lg text-xs font-extrabold transition ${
                roleForGoogle === "TEACHER" ? "bg-white text-[#0056D2] shadow-2xs" : "text-slate-600"
              }`}
            >
              O‘qituvchiman
            </button>
          </div>

          <button
            type="button"
            disabled={googleRedirecting}
            onClick={handleContinueWithGoogle}
            className="w-full py-3.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 active:scale-[0.99] flex items-center justify-center gap-3 text-sm font-bold text-slate-800 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
              <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
            </svg>
            {googleRedirecting ? "Google sahifasiga o‘tilmoqda..." : "Google bilan davom etish"}
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase">yoki login orqali</span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email, @username yoki KY-ID</label>
              <input
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com yoki @username"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">Parol</label>
                <Link href="/forgot-password" className="text-xs font-bold text-[#0056D2] hover:underline">
                  Parolni unutdingizmi?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolingizni kiriting"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-blue-100 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  {showPass ? (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>)}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-bold text-sm transition shadow-md shadow-blue-200/60"
            >
              {loading ? "Kirilmoqda..." : "Kirish"}
            </button>
          </form>

          <div className="pt-3 border-t text-center text-xs text-slate-600">
            KasbYo‘l’da yangimisiz?{" "}
            <Link href="/register" className="text-[#0056D2] font-extrabold hover:underline">
              Bepul ro‘yxatdan o‘tish
            </Link>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          Himoyalangan avtorizatsiya · Argon2id & JWT Security
        </div>
      </div>
    </div>
  );
}