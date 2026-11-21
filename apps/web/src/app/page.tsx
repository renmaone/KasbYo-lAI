"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DOMAINS = [
  { code: "I", title: "Axborot texnologiyalari va AI", desc: "Dasturlash, Sun’iy intellekt, Kiberxavfsizlik va Data Science", count: "24 ta kasb" },
  { code: "R", title: "Muhandislik va Robototexnika", desc: "Elektronika, Mexatronika, Arxitektura va Sanoat dizayni", count: "18 ta kasb" },
  { code: "E", title: "Biznes, Moliya va Boshqaruv", desc: "Tadbirkorlik, Marketing, Moliya tahlili va Loyiha boshqaruvi", count: "21 ta kasb" },
  { code: "A", title: "Dizayn, Media va San’at", desc: "UI/UX Dizayn, 3D Grafika, Kino va Raqamli kontent", count: "15 ta kasb" },
  { code: "S", title: "Ta’lim, Tibbiyot va Psixologiya", desc: "Pedagogika, Klinik tibbiyot, HR va Ijtimoiy sohalar", count: "19 ta kasb" },
  { code: "C", title: "Tahlil, Huquq va Audit", desc: "Iqtisodiyot, Bank ishi, Yuridik maslahat va Statistika", count: "14 ta kasb" },
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [exploreOpen, setExploreOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push("/register");
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Coursera Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#0056D2] text-white font-black text-xl flex items-center justify-center shadow-xs">
                K
              </div>
              <span className="font-black text-xl tracking-tight text-[#0056D2]">KasbYo‘l</span>
            </Link>

            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setExploreOpen(!exploreOpen)}
                className="px-4 py-2 rounded-lg border border-[#0056D2] text-[#0056D2] hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <span>Yo‘nalishlar</span>
                <span>▾</span>
              </button>

              {exploreOpen && (
                <div
                  onMouseLeave={() => setExploreOpen(false)}
                  className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 space-y-1 z-50"
                >
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase text-slate-400">
                    Kasbiy yo‘nalishlar (RIASEC)
                  </div>
                  {DOMAINS.map((d) => (
                    <Link
                      key={d.code}
                      href="/register"
                      className="block px-3 py-2 rounded-xl hover:bg-blue-50 transition"
                    >
                      <div className="text-xs font-bold text-slate-900">{d.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{d.desc}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSearch} className="hidden lg:flex items-center w-80 xl:w-96">
              <div className="flex w-full rounded-full border border-slate-300 focus-within:border-[#0056D2] overflow-hidden bg-slate-50/60">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nimani o‘rganmoqchisiz? (AI, Dizayn, Tibbiyot...)"
                  className="flex-1 px-4 py-2 text-xs bg-transparent outline-none"
                />
                <button
                  type="submit"
                  className="m-1 px-3.5 py-1.5 rounded-full bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-bold transition"
                >
                  Qidirish
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3.5 py-2 text-xs sm:text-sm font-bold text-[#0056D2] hover:underline"
            >
              Kirish
            </Link>
            <Link
              href="/register"
              className="px-4 sm:px-5 py-2.5 rounded-lg bg-[#0056D2] hover:bg-[#00419E] text-white text-xs sm:text-sm font-bold transition shadow-xs"
            >
              Bepul qo‘shilish
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0056D2] text-xs font-bold">
            <span>🎓</span>
            <span>O‘zbekiston o‘quvchilari va o‘qituvchilari uchun yagona ekotizim</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
            Cheksiz bilim va <span className="text-[#0056D2]">to‘g‘ri kasb</span> sari yo‘l
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Xalqaro RIASEC diagnostikasi orqali qobiliyatingizni aniqlang, o‘qituvchilaringiz sinfiga shaxsiy{" "}
            <strong>KY-ID</strong> orqali qo‘shiling va AI Murabbiy bilan kelajak karyerangizni quring.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/register"
              className="px-7 py-4 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-extrabold text-sm sm:text-base transition shadow-lg shadow-blue-200"
            >
              Bepul ro‘yxatdan o‘tish
            </Link>
            <Link
              href="/login"
              className="px-7 py-4 rounded-xl border-2 border-[#0056D2] text-[#0056D2] hover:bg-blue-50 font-extrabold text-sm sm:text-base transition"
            >
              O‘qituvchi sifatida sinf ochish
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-gradient-to-br from-[#0056D2] via-[#00419E] to-indigo-900 p-7 sm:p-8 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-bold">Shaxsiy ID Tizimi</span>
              <span className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs">KY-1001</span>
            </div>
            <h3 className="text-2xl font-extrabold leading-snug">
              Har bir o‘quvchi va o‘qituvchi uchun unikal raqamli pasport
            </h3>
            <ul className="space-y-2.5 text-sm text-blue-100">
              <li className="flex items-center gap-2">✓ Mustaqil ro‘yxatdan o‘tish va Google kirish</li>
              <li className="flex items-center gap-2">✓ O‘qituvchi tomonidan ID orqali sinfga qo‘shish</li>
              <li className="flex items-center gap-2">✓ Elektron diplom va o‘quvchi guvohnomasi</li>
              <li className="flex items-center gap-2">✓ @username orqali o‘zaro muloqot (Chat)</li>
            </ul>
            <Link
              href="/register"
              className="block w-full py-3.5 rounded-xl bg-white text-[#0056D2] font-extrabold text-sm text-center hover:bg-blue-50 transition"
            >
              Hoziroq ID olish →
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Qadamda Qanday Ishlaydi */}
      <section className="border-t border-slate-100 py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Platforma qanday ishlaydi?</h2>
            <p className="text-sm text-slate-500 mt-1">O‘quvchilar va o‘qituvchilar uchun oddiy va shaffof tizim</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#0056D2] text-white font-black flex items-center justify-center">1</div>
              <h3 className="font-extrabold text-base text-slate-900">Ro‘yxatdan o‘ting va ID oling</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                O‘quvchi yoki O‘qituvchi sifatida kiring — tizim sizga avtomatik shaxsiy <strong>KY-XXXX</strong> ID va <strong>@username</strong> beradi.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#0056D2] text-white font-black flex items-center justify-center">2</div>
              <h3 className="font-extrabold text-base text-slate-900">Sinf yarating yoki ID orqali qo‘shiling</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                O‘qituvchi fan izohi va prevyu rasmi bilan sinf ochadi va o‘quvchilarni <strong>KY-ID</strong> orqali topib o‘z sinfiga qo‘shadi.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#0056D2] text-white font-black flex items-center justify-center">3</div>
              <h3 className="font-extrabold text-base text-slate-900">Diagnostika va AI Murabbiy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                RIASEC testini topshiring, shaxsiy kasbiy kodingizni biling va AI Murabbiydan individual rivojlanish rejasini oling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Yo'nalishlar katalogi */}
      <section className="bg-[#F8FAFC] py-16 border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">O‘zingizga mos yo‘nalishni kashf eting</h2>
            <p className="text-sm text-slate-600 mt-1">Qobiliyatingizga mos fanlar va kelajak kasblarini tanlang</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DOMAINS.map((d) => (
              <Link
                key={d.code}
                href="/register"
                className="bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-[#0056D2] hover:shadow-md transition group"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#0056D2] font-black flex items-center justify-center group-hover:bg-[#0056D2] group-hover:text-white transition">
                    {d.code}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{d.count}</span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0056D2] transition">
                  {d.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{d.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-white font-black text-base">
            <span className="w-7 h-7 rounded-lg bg-[#0056D2] flex items-center justify-center text-sm">K</span>
            <span>KasbYo‘l</span>
          </div>
          <div>© 2026 KasbYo‘l Ta’lim va Kasbga Yo‘naltirish Platformasi</div>
          <div className="flex gap-5 font-semibold">
            <Link href="/login" className="hover:text-white">Kirish</Link>
            <Link href="/register" className="hover:text-white">Ro‘yxatdan o‘tish</Link>
            <Link href="/forgot-password" className="hover:text-white">Parolni tiklash</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}