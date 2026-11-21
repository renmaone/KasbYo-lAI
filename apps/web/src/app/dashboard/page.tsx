"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { RiasecRadarChart } from "@/components/dashboard/RiasecRadarChart";
import { CareerMarketModal } from "@/components/dashboard/CareerMarketModal";
import { TeacherAdminPanel } from "@/components/dashboard/TeacherAdminPanel";
import { ProfileSection } from "@/components/dashboard/ProfileSection";
import { TeacherCoursesPanel } from "@/components/dashboard/TeacherCoursesPanel";
import { ChatSection } from "@/components/dashboard/ChatSection";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"overview" | "profile" | "chat" | "courses" | "riasec" | "careers" | "ai" | "admin">("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [courses, setCourses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [riasecResult, setRiasecResult] = useState<any>(null);
  const [submittingTest, setSubmittingTest] = useState(false);

  const [careers, setCareers] = useState<any[]>([]);
  const [careerSearch, setCareerSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeCareer, setActiveCareer] = useState<any>(null);

  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  function loadAllData(parsedUser: any) {
    apiFetch("/users/me")
      .then((fresh) => {
        setUser(fresh);
        localStorage.setItem("kasbyol_user", JSON.stringify(fresh));
      })
      .catch(() => {});

    apiFetch("/courses").then(setCourses).catch(() => {});
    apiFetch("/career/careers").then(setCareers).catch(() => {});
    apiFetch("/career/questions").then(setQuestions).catch(() => {});
    apiFetch("/career/results/me")
      .then((res) => {
        if (res?.result) setRiasecResult(res);
      })
      .catch(() => {});

    if (parsedUser.role === "ADMIN" || parsedUser.role === "SUPER_ADMIN" || parsedUser.role === "TEACHER") {
      apiFetch("/users").then(setAdminUsers).catch(() => {});
      apiFetch("/admin/dashboard-stats").then(setAdminStats).catch(() => {});
      apiFetch("/audit").then(setAuditLogs).catch(() => {});
    }
  }

  useEffect(() => {
    const raw = localStorage.getItem("kasbyol_user");
    if (!raw) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(raw);
    setUser(parsed);
    loadAllData(parsed);
  }, [router]);

  async function submitRiasec() {
    setSubmittingTest(true);
    try {
      const payload = questions.map((q) => ({ questionId: q.id, score: answers[q.id] ?? 3 }));
      const res = await apiFetch("/career/assess", {
        method: "POST",
        body: JSON.stringify({ answers: payload }),
      });
      setRiasecResult(res);
    } finally {
      setSubmittingTest(false);
    }
  }

  async function sendAi(customPrompt?: string) {
    const msg = customPrompt || aiInput;
    if (!msg.trim()) return;
    if (!customPrompt) setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", text: msg }]);
    setAiLoading(true);
    try {
      const res = await apiFetch("/career/ai-mentor/chat", {
        method: "POST",
        body: JSON.stringify({ message: msg }),
      });
      setAiMessages((prev) => [...prev, { role: "ai", text: res.reply }]);
    } catch (e: any) {
      setAiMessages((prev) => [...prev, { role: "ai", text: e.message }]);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("kasbyol_access_token");
    localStorage.removeItem("kasbyol_user");
    router.push("/login");
  }

  if (!user) return null;

  const isTeacherOrAdmin = user.role === "TEACHER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const categories = ["ALL", ...Array.from(new Set(careers.map((c) => c.category)))];
  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const navItems = [
    { id: "overview", label: "Bosh sahifa" },
    { id: "profile", label: "Shaxsiy Profil", badge: user.publicId || "ID" },
    { id: "chat", label: "Muloqot", badge: "Chat" },
    { id: "courses", label: isTeacherOrAdmin ? "Sinflarim" : "Mening sinflarim", badge: courses.length },
    { id: "riasec", label: "RIASEC Diagnostika", badge: riasecResult?.result?.topCode },
    { id: "careers", label: "Kasblar katalogi", badge: careers.length },
    { id: "ai", label: "AI Murabbiy" },
    ...(isTeacherOrAdmin ? [{ id: "admin", label: "O‘quvchilar va Tahlil" }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-68 bg-[#1E1B4B] text-white p-5 flex flex-col justify-between transition-transform lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-2 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5A4FE3] to-amber-400 flex items-center justify-center font-black text-white">
                K
              </div>
              <div>
                <div className="font-extrabold text-lg tracking-tight leading-none">KasbYo‘l AI</div>
                <span className="text-[10px] text-indigo-300 uppercase tracking-widest">Kelajak Navigatori</span>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-indigo-200 text-lg">
              ✕
            </button>
          </div>

          {/* Foydalanuvchi ID kartochkasi */}
          <div
            onClick={() => setTab("profile")}
            className="mb-5 p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 cursor-pointer transition border border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold">Shaxsiy ID</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-xs">
                {user.publicId || "KY-1001"}
              </span>
            </div>
            <div className="text-xs font-bold text-white mt-1.5 truncate">
              {user.profile?.firstName} {user.profile?.lastName}
            </div>
            <div className="text-[11px] text-indigo-300 mt-0.5">
              {user.phoneVerified ? `✓ ${user.phone}` : "⚠ Telefon tasdiqlanmagan"}
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold transition ${
                  tab === item.id
                    ? "bg-[#5A4FE3] text-white shadow-lg shadow-indigo-950/40"
                    : "text-indigo-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <Link
          href="/about"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-2.5 rounded-xl text-sm font-medium text-slate-300 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition"
        >
          <span>Sayt haqida</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full py-2.5 rounded-xl border border-white/15 text-xs font-bold text-rose-200 hover:bg-rose-500/20 transition"
        >
          Tizimdan chiqish
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-white border text-slate-700 font-bold"
            >
              ☰
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Salom, {user.profile?.firstName || "Foydalanuvchi"}!
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                ID: <span className="font-black text-[#5A4FE3]">{user.publicId || "KY-1001"}</span> · Rol:{" "}
                <span className="font-semibold">{user.role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user.phoneVerified && (
              <button
                onClick={() => setTab("profile")}
                className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition"
              >
                📱 Telefon raqamni ulash va tasdiqlash
              </button>
            )}
            <button
              onClick={() => setTab("profile")}
              className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-[#5A4FE3] transition"
            >
              Profilni tahrirlash
            </button>
          </div>
        </header>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-r from-[#5A4FE3] via-[#4338CA] to-indigo-600 text-white p-7 md:p-9 shadow-lg shadow-indigo-200">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider">
                  Shaxsiy ID: {user.publicId || "KY-1001"}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-100 text-xs font-bold">
                  ✓ Akkaunt faol
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
                {isTeacherOrAdmin
                  ? "O‘quvchilaringizni ID orqali darsga qo‘shing va tahlil qiling"
                  : "Qobiliyatingizni aniqlang va kelajak kasbingizni tanlang"}
              </h2>
              <p className="text-indigo-100 text-sm max-w-2xl mb-6">
                {isTeacherOrAdmin
                  ? "Har bir o‘quvchida unikal KY-XXXX ID mavjud. Darslar bo‘limiga o‘tib o‘quvchilarni darsga biriktiring va ularning RIASEC natijalarini kuzating."
                  : "O‘qituvchingiz sizni darsga qo‘shishi uchun shaxsiy ID raqamingizni bering. Shuningdek, 42 savolli RIASEC diagnostikasidan o‘tib o‘z profilingizni aniqlang."}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setTab(isTeacherOrAdmin ? "courses" : "riasec")}
                  className="px-6 py-3 rounded-xl bg-white text-[#5A4FE3] font-extrabold text-sm hover:bg-indigo-50 transition"
                >
                  {isTeacherOrAdmin ? "Darsga o‘quvchi qo‘shish" : "RIASEC Testni boshlash"}
                </button>
                <button
                  onClick={() => setTab("profile")}
                  className="px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm transition"
                >
                  Shaxsiy profil va telefon tasdiqlash
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border shadow-xs">
                <div className="text-xs font-bold text-slate-400">
                  {isTeacherOrAdmin ? "SIZNING SINFLARINGIZ" : "SIZ QO‘SHILGAN SINFLAR"}
                </div>
                <div className="text-3xl font-extrabold text-[#5A4FE3] mt-1">{courses.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-xs">
                <div className="text-xs font-bold text-slate-400">KASBLAR BAZASI</div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-1">{careers.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-xs">
                <div className="text-xs font-bold text-slate-400">RIASEC PROFIL</div>
                <div className="text-3xl font-extrabold text-amber-500 mt-1">
                  {riasecResult?.result?.topCode || "—"}
                </div>
              </div>
            </div>

            {riasecResult?.result?.scores && (
              <div className="space-y-3">
                <h3 className="text-lg font-extrabold text-slate-900">Sizning RIASEC Radar Tahlilingiz</h3>
                <RiasecRadarChart scores={riasecResult.result.scores} />
              </div>
            )}
          </div>
        )}

        {tab === "profile" && <ProfileSection onUserUpdated={(u) => setUser(u)} />}
        {tab === "chat" && <ChatSection currentUser={user} />}

        {tab === "courses" &&
          (isTeacherOrAdmin ? (
            <TeacherCoursesPanel courses={courses} onRefresh={() => loadAllData(user)} />
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#EEF2FF] border border-indigo-200 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-700">
                  Yangi darsga qo‘shilish uchun o‘qituvchingizga shaxsiy ID raqamingizni bering:{" "}
                  <strong className="text-[#5A4FE3] text-sm">{user.publicId}</strong>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.length === 0 ? (
                  <div className="col-span-full bg-white p-10 rounded-3xl border border-dashed text-center text-xs text-slate-500">
                    Siz hali birorta sinfga qo‘shilmagansiz. O‘qituvchingizga <strong>{user.publicId}</strong> ID raqamingizni bering.
                  </div>
                ) : (
                  courses.map((c) => (
                    <div key={c.id} className="bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col justify-between">
                      <div>
                        {c.coverUrl && (
                          <div className="h-40 w-full bg-slate-100 overflow-hidden">
                            <img src={c.coverUrl} alt={c.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                            ✓ O‘qituvchi tomonidan qo‘shilgan
                          </span>
                          <h3 className="font-extrabold text-lg mt-3 mb-1.5">{c.title}</h3>
                          <p className="text-xs text-slate-600 mb-3 leading-relaxed">{c.description}</p>
                        </div>
                      </div>
                      <div className="px-5 py-3.5 bg-slate-50 border-t text-xs text-slate-600">
                        <div className="flex items-center justify-between w-full"><span>Ustoz: <strong>{c.teacher?.profile?.firstName}</strong></span><Link href={`/dashboard/courses/${c.id}`} className="px-3 py-1.5 rounded-lg bg-[#0056D2] text-white font-bold hover:bg-[#00419E]">Sinfga kirish →</Link></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}

        {tab === "riasec" && (
          <div className="space-y-6">
            {riasecResult && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-[#EEF2FF] border border-indigo-200">
                  <div className="font-extrabold text-xl text-[#4338CA]">
                    Sizning yetakchi kodingiz: {riasecResult.result.topCode}
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{riasecResult.result.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {riasecResult.recommendedCareers?.map((rc: any) => (
                      <button
                        key={rc.id}
                        onClick={() => setActiveCareer(rc)}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#5A4FE3] hover:text-white text-xs font-bold border border-indigo-100 transition"
                      >
                        {rc.title} →
                      </button>
                    ))}
                  </div>
                </div>
                {riasecResult.result.scores && <RiasecRadarChart scores={riasecResult.result.scores} />}
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-extrabold">Holland RIASEC Diagnostika Testi</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    1 dan 5 gacha belgilang · Belgilandi: {answeredCount}/{questions.length}
                  </p>
                </div>
                <div className="w-full md:w-48">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Jarayon</span>
                    <span className="text-[#5A4FE3]">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5A4FE3] transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                {questions.map((q, i) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <span className="text-sm font-medium text-slate-800">
                      <strong className="text-[#5A4FE3] mr-1.5">{i + 1}.</strong> {q.text}
                    </span>
                    <div className="flex gap-1.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: num }))}
                          className={`w-9 h-9 rounded-xl text-xs font-extrabold border transition ${
                            (answers[q.id] ?? 3) === num
                              ? "bg-[#5A4FE3] text-white border-[#5A4FE3]"
                              : "bg-white text-slate-600"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={submitRiasec}
                disabled={submittingTest}
                className="px-7 py-3.5 rounded-xl bg-[#5A4FE3] hover:bg-[#4338CA] text-white font-extrabold text-sm transition"
              >
                {submittingTest ? "Hisoblanmoqda..." : "Natijani hisoblash va saqlash"}
              </button>
            </div>
          </div>
        )}

        {tab === "careers" && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row gap-3 justify-between">
              <input
                placeholder="Kasb nomi bo‘yicha qidirish..."
                value={careerSearch}
                onChange={(e) => setCareerSearch(e.target.value)}
                className="w-full md:max-w-sm px-4 py-2.5 rounded-xl border bg-white text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      selectedCategory === cat ? "bg-[#5A4FE3] text-white" : "bg-white border text-slate-600"
                    }`}
                  >
                    {cat === "ALL" ? "Barcha sohalar" : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {careers
                .filter((c) => {
                  const matchSearch = c.title.toLowerCase().includes(careerSearch.toLowerCase());
                  const matchCat = selectedCategory === "ALL" || c.category === selectedCategory;
                  return matchSearch && matchCat;
                })
                .map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setActiveCareer(c)}
                    className="bg-white p-6 rounded-2xl border hover:border-[#5A4FE3] hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-3">
                        <span className="px-2.5 py-1 rounded-lg bg-[#EEF2FF] text-[#5A4FE3]">{c.category}</span>
                        <span className="text-slate-400">RIASEC: {c.riasecCodes.join("-")}</span>
                      </div>
                      <h3 className="font-extrabold text-lg text-slate-900 mb-1.5">{c.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-4">{c.description}</p>
                    </div>
                    <div className="text-xs border-t pt-3 flex justify-between">
                      <span className="text-slate-400">Maosh:</span>
                      <span className="font-bold text-emerald-700">{c.salaryRange}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === "ai" && (
          <div className="bg-white p-6 rounded-2xl border shadow-xs max-w-4xl">
            <h2 className="text-xl font-extrabold mb-1">AI Murabbiy</h2>
            <p className="text-xs text-slate-500 mb-4">RIASEC profilingiz va O‘zbekiston ta‘lim tizimi asosida maslahatchi</p>

            <div className="h-96 overflow-y-auto p-4 rounded-2xl bg-slate-50 border space-y-3 mb-4">
              {aiMessages.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-16">
                  Assalomu alaykum! Kelajak kasbingiz, OTM tanlash yoki fanlar bo‘yicha savolingizni bering.
                </div>
              )}
              {aiMessages.map((m, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl text-sm max-w-[82%] whitespace-pre-line ${
                    m.role === "user" ? "bg-[#5A4FE3] text-white ml-auto" : "bg-white border text-slate-800"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {aiLoading && <div className="text-xs text-[#5A4FE3] font-semibold">AI Murabbiy javob yozmoqda...</div>}
            </div>

            <div className="flex gap-2">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAi()}
                placeholder="Savolingizni yozing..."
                className="flex-1 px-4 py-3 rounded-xl border text-sm"
              />
              <button onClick={() => sendAi()} className="px-6 py-3 rounded-xl bg-[#5A4FE3] text-white font-bold text-sm">
                Yuborish
              </button>
            </div>
          </div>
        )}

        {tab === "admin" && (
          <TeacherAdminPanel adminStats={adminStats} adminUsers={adminUsers} auditLogs={auditLogs} />
        )}
      </main>

      <CareerMarketModal
        career={activeCareer}
        onClose={() => setActiveCareer(null)}
        onAskAi={(title) => {
          setTab("ai");
          sendAi(`${title} kasbini egallash uchun qaysi fanlarni o‘qishim va O‘zbekistondagi qaysi OTMga topshirishim kerak?`);
        }}
      />
    </div>
  );
}
