"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [devCodeHint, setDevCodeHint] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      });
      setMaskedEmail(res.maskedEmail || identifier);
      setDevCodeHint(res.devCode || "");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Foydalanuvchi topilmadi");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ identifier, code, newPassword }),
      });
      alert(res.message);
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Parolni yangilashda xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0056D2] text-white font-black flex items-center justify-center">K</div>
          <span className="font-black text-xl tracking-tight text-[#0056D2]">KasbYo‘l</span>
        </Link>
        <Link href="/login" className="text-xs font-bold text-[#0056D2] hover:underline">
          ← Kirish sahifasiga qaytish
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056D2] text-xl font-black flex items-center justify-center mx-auto mb-2">
              🔐
            </div>
            <h1 className="text-2xl font-black text-slate-900">Parolni tiklash</h1>
            <p className="text-xs text-slate-500">
              {step === 1
                ? "Ro‘yxatdan o‘tgan Email, @username yoki KY-ID raqamingizni kiriting"
                : `${maskedEmail} uchun yuborilgan 6 xonali kod va yangi parolni kiriting`}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email, @username yoki KY-ID</label>
                <input
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ozodbek@gmail.com yoki @ozodbek"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-bold text-sm transition shadow-sm"
              >
                {loading ? "Kod yuborilmoqda..." : "Tasdiqlash kodini olish"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {devCodeHint && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex justify-between items-center">
                  <span>Tasdiqlash kodi: <strong className="font-mono text-sm">{devCodeHint}</strong></span>
                  <button
                    type="button"
                    onClick={() => setCode(devCodeHint)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px]"
                  >
                    Kodni qo‘yish
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">6 xonali tasdiqlash kodi</label>
                <input
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center font-mono text-lg font-black tracking-widest outline-none focus:border-[#0056D2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Yangi parol (kamida 6 ta belgi)</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yangi parolni kiriting"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0056D2] pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    {showPass ? "Yashir" : "Ko‘r"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-bold text-sm transition"
              >
                {loading ? "Saqlanmoqda..." : "Yangi parolni saqlash"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                ← Boshqa akkaunt kiritish
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}