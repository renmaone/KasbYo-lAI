"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function CourseClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = String(params?.id || "");

  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string>("");
  const [tab, setTab] = useState<"lessons" | "students" | "leaderboard" | "certificate">("lessons");
  const [loading, setLoading] = useState(true);

  const [showNewLesson, setShowNewLesson] = useState(false);
  const [lTitle, setLTitle] = useState("");
  const [lContent, setLContent] = useState("");
  const [lVideo, setLVideo] = useState("");
  const [lHomework, setLHomework] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);

  const [textAnswer, setTextAnswer] = useState("");
  const [submittingHw, setSubmittingHw] = useState(false);

  const [gradeScores, setGradeScores] = useState<Record<string, string>>({});
  const [gradeFeedbacks, setGradeFeedbacks] = useState<Record<string, string>>({});

  const [studentQuery, setStudentQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [enrollingId, setEnrollingId] = useState("");

  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  async function loadAll() {
    try {
      const me = await apiFetch("/users/me");
      setUser(me);
      const allCourses = await apiFetch("/courses");
      const found = allCourses.find((c: any) => c.id === courseId);
      if (!found) {
        router.push("/dashboard");
        return;
      }
      setCourse(found);

      const lessonList = await apiFetch(`/courses/${courseId}/lessons`);
      setLessons(lessonList);
      if (lessonList.length > 0 && !activeLessonId) {
        setActiveLessonId(lessonList[0].id);
        if (lessonList[0].submissions?.[0]?.textAnswer) {
          setTextAnswer(lessonList[0].submissions[0].textAnswer);
        }
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (courseId) loadAll();
  }, [courseId]);

  useEffect(() => {
    if (!isTeacher || tab !== "students") return;
    const t = setTimeout(() => {
      apiFetch(`/users/search-students?q=${encodeURIComponent(studentQuery)}`)
        .then(setSearchResults)
        .catch(() => setSearchResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [isTeacher, tab, studentQuery]);

  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];

  function selectLesson(lesson: any) {
    setActiveLessonId(lesson.id);
    setTextAnswer(lesson.submissions?.[0]?.textAnswer || "");
  }

  async function handleCreateLesson(e: React.FormEvent) {
    e.preventDefault();
    setSavingLesson(true);
    try {
      const created = await apiFetch(`/courses/${courseId}/lessons`, {
        method: "POST",
        body: JSON.stringify({ title: lTitle, content: lContent, videoUrl: lVideo, homework: lHomework }),
      });
      setLTitle("");
      setLContent("");
      setLVideo("");
      setLHomework("");
      setShowNewLesson(false);
      await loadAll();
      setActiveLessonId(created.id);
    } catch (err: any) {
      alert(err.message || "Dars qo\u2018shishda xatolik");
    } finally {
      setSavingLesson(false);
    }
  }

  async function handleSubmitHomework(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLesson) return;
    setSubmittingHw(true);
    try {
      await apiFetch(`/courses/lessons/${activeLesson.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ textAnswer }),
      });
      alert("Uyga vazifangiz o\u2018qituvchiga muvaffaqiyatli yuborildi!");
      await loadAll();
    } catch (err: any) {
      alert(err.message || "Xatolik");
    } finally {
      setSubmittingHw(false);
    }
  }

  async function handleGrade(submissionId: string) {
    const score = Number(gradeScores[submissionId] ?? 100);
    const feedback = gradeFeedbacks[submissionId] || "";
    try {
      await apiFetch(`/courses/submissions/${submissionId}/grade`, {
        method: "POST",
        body: JSON.stringify({ score, feedback }),
      });
      alert("Baho saqlandi!");
      await loadAll();
    } catch (err: any) {
      alert(err.message || "Baholashda xatolik");
    }
  }

  async function handleEnrollByPublicId(publicId: string) {
    if (!publicId.trim()) return;
    setEnrollingId(publicId);
    try {
      const res = await apiFetch(`/courses/${courseId}/enroll-by-id`, {
        method: "POST",
        body: JSON.stringify({ publicId: publicId.trim() }),
      });
      alert(res.message);
      await loadAll();
    } catch (err: any) {
      alert(err.message || "Qo\u2018shishda xatolik");
    } finally {
      setEnrollingId("");
    }
  }

  async function handleRemoveStudent(studentId: string) {
    if (!confirm("O\u2018quvchini sinfdan chiqarasizmi?")) return;
    try {
      await apiFetch(`/courses/${courseId}/students/${studentId}`, { method: "DELETE" });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-bold text-slate-500">
        Sinf o\u2018quv xonasi yuklanmoqda...
      </div>
    );
  }

  const mySubmissions = lessons.flatMap((l) => (l.submissions || []).filter((s: any) => s.studentId === user?.id));
  const myTotalScore = mySubmissions.reduce((acc: number, s: any) => acc + (Number(s.score) || 0), 0);
  const enrolledIds = new Set((course.enrollments || []).map((e: any) => e.student?.id));

  const leaderboard = (course.enrollments || [])
    .map((en: any) => {
      const st = en.student;
      const subs = lessons.flatMap((l) => (l.submissions || []).filter((s: any) => s.studentId === st.id));
      const total = subs.reduce((acc: number, s: any) => acc + (Number(s.score) || 0), 0);
      return { student: st, totalScore: total, completedCount: subs.length };
    })
    .sort((a: any, b: any) => b.totalScore - a.totalScore);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700">
            \u2190 Kabinetga
          </Link>
          <div>
            <div className="text-[11px] font-extrabold uppercase text-[#0056D2]">
              {isTeacher ? "O\u2018qituvchi boshqaruv xonasi" : `Ustoz: ${course.teacher?.profile?.firstName} ${course.teacher?.profile?.lastName}`}
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900">{course.title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setTab("lessons")} className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${tab === "lessons" ? "bg-[#0056D2] text-white" : "bg-slate-100 text-slate-700"}`}>
            Darslar ({lessons.length})
          </button>
          <button onClick={() => setTab("students")} className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${tab === "students" ? "bg-[#0056D2] text-white" : "bg-slate-100 text-slate-700"}`}>
            O\u2018quvchilar ({course.enrollments?.length || 0})
          </button>
          <button onClick={() => setTab("leaderboard")} className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${tab === "leaderboard" ? "bg-[#0056D2] text-white" : "bg-slate-100 text-slate-700"}`}>
            Reyting
          </button>
          {!isTeacher && (
            <button onClick={() => setTab("certificate")} className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${tab === "certificate" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>
              Sertifikat
            </button>
          )}
        </div>
      </header>

      {tab === "lessons" && (
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 grid lg:grid-cols-12 gap-6 flex-1">
          <aside className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase text-slate-400">O\u2018quv dasturi</span>
                {isTeacher && (
                  <button onClick={() => setShowNewLesson(!showNewLesson)} className="px-3 py-1.5 rounded-lg bg-[#0056D2] text-white text-xs font-bold hover:bg-[#00419E]">
                    + Yangi dars
                  </button>
                )}
              </div>

              {lessons.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                  Hozircha darslar qo\u2018shilmagan.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {lessons.map((lesson, idx) => {
                    const isSelected = activeLesson?.id === lesson.id;
                    const mySub = !isTeacher ? lesson.submissions?.[0] : null;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson)}
                        className={`w-full text-left p-3.5 rounded-xl border transition flex items-start justify-between gap-2 ${isSelected ? "bg-blue-50/80 border-[#0056D2] text-[#0056D2]" : "bg-white border-slate-100 hover:bg-slate-50 text-slate-800"}`}
                      >
                        <div>
                          <div className="text-[11px] font-bold opacity-70">{idx + 1}-dars</div>
                          <div className="text-xs font-extrabold mt-0.5">{lesson.title}</div>
                        </div>
                        {mySub && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black shrink-0">
                            {mySub.score !== null && mySub.score !== undefined ? `${mySub.score} ball` : "Topshirildi"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <main className="lg:col-span-8 space-y-5">
            {showNewLesson && isTeacher && (
              <form onSubmit={handleCreateLesson} className="bg-white rounded-2xl border-2 border-[#0056D2] p-6 space-y-4 shadow-lg">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-base text-slate-900">Yangi dars mavzusi qo\u2018shish</h3>
                  <button type="button" onClick={() => setShowNewLesson(false)} className="text-slate-400 font-bold">X</button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dars mavzusi *</label>
                  <input required value={lTitle} onChange={(e) => setLTitle(e.target.value)} placeholder="1-mavzu. Kirish" className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">YouTube video havola (ixtiyoriy)</label>
                  <input value={lVideo} onChange={(e) => setLVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dars matni / Konspekt *</label>
                  <textarea required rows={5} value={lContent} onChange={(e) => setLContent(e.target.value)} placeholder="Darsning to\u2018liq mazmunini yozing..." className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Uyga vazifa sharti (ixtiyoriy)</label>
                  <textarea rows={2} value={lHomework} onChange={(e) => setLHomework(e.target.value)} placeholder="Topshiriq sharti..." className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
                </div>
                <button type="submit" disabled={savingLesson} className="px-6 py-3 rounded-xl bg-[#0056D2] text-white font-bold text-xs">
                  {savingLesson ? "Saqlanmoqda..." : "Darsni e\u2018lon qilish"}
                </button>
              </form>
            )}

            {activeLesson ? (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-4 shadow-2xs">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0056D2] text-xs font-extrabold">Dars materiali</span>
                  <h2 className="text-2xl font-black text-slate-900">{activeLesson.title}</h2>
                  {activeLesson.videoUrl && (
                    <a href={activeLesson.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100">
                      Video darsni ochish ({activeLesson.videoUrl})
                    </a>
                  )}
                  <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed pt-2 border-t">{activeLesson.content}</div>
                </div>

                {activeLesson.homework && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-base text-slate-900">Uyga vazifa topshirig\u2018i</h3>
                      {!isTeacher && activeLesson.submissions?.[0]?.score !== null && activeLesson.submissions?.[0]?.score !== undefined && (
                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                          Baho: {activeLesson.submissions[0].score} / 100
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border">{activeLesson.homework}</p>

                    {!isTeacher ? (
                      <form onSubmit={handleSubmitHomework} className="space-y-3">
                        <textarea required rows={4} value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} placeholder="Vazifa javobingizni shu yerga yozing..." className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0056D2]" />
                        {activeLesson.submissions?.[0]?.feedback && (
                          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                            <strong>O\u2018qituvchi izohi:</strong> {activeLesson.submissions[0].feedback}
                          </div>
                        )}
                        <button type="submit" disabled={submittingHw} className="px-6 py-3 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-bold text-xs">
                          {submittingHw ? "Yuborilmoqda..." : activeLesson.submissions?.length ? "Javobni yangilash" : "Vazifani topshirish"}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-extrabold uppercase text-slate-400">
                          O\u2018quvchilar topshirgan javoblar ({activeLesson.submissions?.length || 0})
                        </h4>
                        {(!activeLesson.submissions || activeLesson.submissions.length === 0) ? (
                          <div className="text-xs text-slate-500">Hali hech kim vazifa topshirmadi.</div>
                        ) : (
                          activeLesson.submissions.map((sub: any) => (
                            <div key={sub.id} className="p-4 rounded-xl border bg-slate-50 space-y-2.5">
                              <div className="flex justify-between items-center">
                                <div className="text-xs font-extrabold">
                                  {sub.student?.profile?.firstName} {sub.student?.profile?.lastName}{" "}
                                  <span className="text-[#0056D2]">({sub.student?.publicId})</span>
                                </div>
                                {sub.score !== null && sub.score !== undefined && (
                                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">{sub.score} ball</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border whitespace-pre-line">{sub.textAnswer}</p>
                              <div className="flex flex-wrap gap-2 items-center">
                                <input type="number" min={0} max={100} placeholder="Ball (0-100)" value={gradeScores[sub.id] ?? (sub.score ?? "")} onChange={(e) => setGradeScores({ ...gradeScores, [sub.id]: e.target.value })} className="w-28 px-3 py-1.5 rounded-lg border text-xs bg-white" />
                                <input placeholder="Izoh..." value={gradeFeedbacks[sub.id] ?? (sub.feedback ?? "")} onChange={(e) => setGradeFeedbacks({ ...gradeFeedbacks, [sub.id]: e.target.value })} className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border text-xs bg-white" />
                                <button type="button" onClick={() => handleGrade(sub.id)} className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">Baholash</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border p-12 text-center text-sm text-slate-500">
                {isTeacher ? "Chap tarafdagi + Yangi dars tugmasini bosib dars yarating." : "O\u2018qituvchi hali dars qo\u2018shmagan."}
              </div>
            )}
          </main>
        </div>
      )}

      {tab === "students" && (
        <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
          {isTeacher && (
            <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-2xs">
              <div>
                <h3 className="font-black text-base">O\u2018quvchilarni qidirish va ID orqali sinfga qo\u2018shish</h3>
                <p className="text-xs text-slate-500">O\u2018quvchining KY-XXXX ID raqamini yoki ismini kiriting</p>
              </div>
              <div className="flex gap-2">
                <input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="KY-1015 yoki ism..." className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#0056D2]" />
                {studentQuery.trim() && (
                  <button onClick={() => handleEnrollByPublicId(studentQuery)} className="px-5 py-3 rounded-xl bg-[#0056D2] text-white text-xs font-bold shrink-0">ID bilan qo\u2018shish</button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {searchResults.map((st) => {
                  const added = enrolledIds.has(st.id);
                  return (
                    <div key={st.id} className="p-3 rounded-xl border bg-slate-50 flex justify-between items-center">
                      <div className="text-xs">
                        <strong>{st.profile?.firstName} {st.profile?.lastName}</strong>
                        <div className="text-[11px] text-[#0056D2] font-bold">{st.publicId} - @{st.username}</div>
                      </div>
                      <button disabled={added || enrollingId === st.publicId} onClick={() => handleEnrollByPublicId(st.publicId)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${added ? "bg-emerald-100 text-emerald-700" : "bg-[#0056D2] text-white"}`}>
                        {added ? "Sinfda" : "+ Qo\u2018shish"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border p-6 space-y-3 shadow-2xs">
            <h3 className="font-black text-base">Sinfdagi o\u2018quvchilar ({course.enrollments?.length || 0})</h3>
            {(!course.enrollments || course.enrollments.length === 0) ? (
              <div className="text-xs text-slate-500">Hozircha bu sinfda o\u2018quvchilar yo\u2018q.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {course.enrollments.map((en: any) => (
                  <div key={en.id} className="p-3.5 rounded-xl border bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold">{en.student?.profile?.firstName} {en.student?.profile?.lastName}</div>
                      <div className="text-[11px] text-slate-500">@{en.student?.username} - {en.student?.publicId}</div>
                    </div>
                    {isTeacher ? (
                      <button onClick={() => handleRemoveStudent(en.student.id)} className="text-xs text-rose-500 font-bold hover:underline">Chiqarish</button>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">Faol</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="max-w-3xl w-full mx-auto p-4 sm:p-6">
          <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-2xs">
            <div>
              <h3 className="font-black text-lg text-slate-900">Sinf o\u2018quvchilari reytingi</h3>
              <p className="text-xs text-slate-500">Bajarilgan vazifalar va o\u2018qituvchi qo\u2018ygan ballar bo\u2018yicha jadval</p>
            </div>
            {leaderboard.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">Hozircha reyting ma\u2018lumotlari yo\u2018q.</div>
            ) : (
              <div className="divide-y">
                {leaderboard.map((item: any, index: number) => (
                  <div key={item.student.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center ${index === 0 ? "bg-amber-400 text-slate-950" : index === 1 ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-600"}`}>
                        #{index + 1}
                      </span>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{item.student.profile?.firstName} {item.student.profile?.lastName}</div>
                        <div className="text-[11px] text-slate-400">{item.student.publicId} - {item.completedCount} ta vazifa</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-blue-50 text-[#0056D2] font-black text-xs">{item.totalScore} ball</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "certificate" && !isTeacher && (
        <div className="max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-4">
          <div className="bg-white rounded-3xl border-4 border-double border-[#0056D2] p-8 sm:p-12 text-center space-y-5 shadow-xl relative overflow-hidden">
            <div className="text-xs font-black tracking-widest uppercase text-[#0056D2]">KasbYo\u2018l Rasmiy Ta\u2018lim Sertifikati</div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">SERTIFIKAT</h2>
            <p className="text-xs text-slate-500">Ushbu hujjat quyidagi o\u2018quvchiga taqdim etiladi:</p>
            <div className="text-2xl sm:text-3xl font-black text-[#0056D2] underline decoration-amber-400 underline-offset-8">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </div>
            <p className="text-sm text-slate-700 max-w-lg mx-auto leading-relaxed">
              <strong>{course.title}</strong> o\u2018quv dasturi bo\u2018yicha mashg\u2018ulotlarda faol qatnashib, <strong>{myTotalScore} ball</strong> natija ko\u2018rsatgani uchun berildi.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-6 border-t text-xs">
              <div>
                <div className="text-slate-400">O\u2018quvchi ID</div>
                <div className="font-black text-slate-800">{user?.publicId}</div>
              </div>
              <div>
                <div className="text-slate-400">Sertifikat raqami</div>
                <div className="font-mono font-black text-[#0056D2]">CERT-{course.id.slice(-6).toUpperCase()}</div>
              </div>
              <div>
                <div className="text-slate-400">Sinf rahbari</div>
                <div className="font-black text-slate-800">{course.teacher?.profile?.firstName} {course.teacher?.profile?.lastName}</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <button onClick={() => window.print()} className="px-6 py-3 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-bold text-xs shadow-md">
              Sertifikatni chop etish / PDF saqlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
