"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export function ProfileSection({ onUserUpdated }: { onUserUpdated: (u: any) => void }) {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Shaxsiy ma'lumotlar va Rasm
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("MALE");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [bio, setBio] = useState("");

  // O'quvchi tasdiqlash
  const [grade, setGrade] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [studentDocUrl, setStudentDocUrl] = useState("");
  const [studentDocName, setStudentDocName] = useState("");

  // O'qituvchi tasdiqlash (Ish joyi, tajriba, fanlar, elektron diplom)
  const [workplace, setWorkplace] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [subjects, setSubjects] = useState("");
  const [education, setEducation] = useState("Oliy");
  const [diplomaUrl, setDiplomaUrl] = useState("");
  const [diplomaFileName, setDiplomaFileName] = useState("");

  // Telefon OTP
  const [phoneInput, setPhoneInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [demoOtpHint, setDemoOtpHint] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");

  async function loadProfile() {
    try {
      const data = await apiFetch("/users/me");
      setMe(data);
      setAvatarUrl(data.profile?.avatarUrl || "");
      setUsername(data.username || "");
      setFirstName(data.profile?.firstName || "");
      setLastName(data.profile?.lastName || "");
      setMiddleName(data.profile?.middleName || "");
      setBirthDate(data.profile?.birthDate ? String(data.profile.birthDate).slice(0, 10) : "");
      setGender(data.profile?.gender || "MALE");
      setRegion(data.profile?.region || data.studentProfile?.region || "");
      setDistrict(data.profile?.district || data.studentProfile?.district || "");
      setBio(data.profile?.bio || "");

      setGrade(data.studentProfile?.grade || "9-sinf");
      setSchoolName(data.studentProfile?.schoolName || "");
      setStudentDocUrl(data.studentProfile?.studentDocUrl || "");

      setWorkplace(data.teacherProfile?.workplace || "");
      setExperienceYears(String(data.teacherProfile?.experienceYears ?? 0));
      setSubjects(data.teacherProfile?.subjects?.join(", ") || "");
      setEducation(data.teacherProfile?.education || "Oliy");
      setDiplomaUrl(data.teacherProfile?.diplomaUrl || "");

      setPhoneInput(data.phone || "");
      onUserUpdated(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Rasm hajmi 2 MB dan kichik bo‘lishi kerak");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>, type: "DIPLOMA" | "STUDENT") {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Fayl hajmi 3 MB dan kichik bo‘lishi kerak");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (type === "DIPLOMA") {
        setDiplomaUrl(String(reader.result));
        setDiplomaFileName(file.name);
      } else {
        setStudentDocUrl(String(reader.result));
        setStudentDocName(file.name);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          username,
          avatarUrl,
          firstName,
          lastName,
          middleName,
          birthDate: birthDate || undefined,
          gender,
          region,
          district,
          bio,
          grade,
          schoolName,
          studentDocUrl,
          workplace,
          experienceYears: Number(experienceYears || 0),
          subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
          education,
          diplomaUrl,
        }),
      });
      setMe(updated);
      localStorage.setItem("kasbyol_user", JSON.stringify(updated));
      onUserUpdated(updated);
      alert("Profil ma’lumotlari va tasdiqlash hujjatlari muvaffaqiyatli saqlandi!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendOtp() {
    setPhoneMsg("");
    try {
      const res = await apiFetch("/users/me/phone/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone: phoneInput }),
      });
      setOtpSent(true);
      setPhoneMsg(res.message);
      if (res.demoCode) setDemoOtpHint(res.demoCode);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleVerifyOtp() {
    try {
      const res = await apiFetch("/users/me/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ code: otpCode }),
      });
      setPhoneMsg(res.message);
      setOtpSent(false);
      setOtpCode("");
      setDemoOtpHint("");
      await loadProfile();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="p-8 text-sm text-slate-500">Profil yuklanmoqda...</div>;

  const isVerifiedRole = me?.role === "TEACHER" ? me?.teacherProfile?.isVerified : me?.studentProfile?.isVerified;

  return (
    <div className="max-w-4xl space-y-6">
      {/* 1. Profil rasmi, @username, Unikal ID va Tasdiqlash holati */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer group shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-[#5A4FE3]" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#5A4FE3] to-indigo-400 text-white font-black text-2xl flex items-center justify-center">
                {firstName?.[0] || "U"}{lastName?.[0] || ""}
              </div>
            )}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap opacity-90 group-hover:bg-[#5A4FE3]">
              📷 Rasm yuklash
            </span>
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{firstName} {lastName}</h2>
              {isVerifiedRole ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  ✓ {me?.role === "TEACHER" ? "Tasdiqlangan O‘qituvchi" : "Tasdiqlangan O‘quvchi"}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                  ⏳ Maqom tasdiqlanmagan
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-[#5A4FE3] mt-1">@{me?.username || "username"} · {me?.email}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              🔒 Maxfiylik: Shaxsiy raqam va hujjatlar faqat o‘zingizga va dars o‘qituvchingizga ko‘rinadi.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#EEF2FF] border border-indigo-200 text-center shrink-0">
          <div className="text-[10px] font-bold text-[#4338CA] uppercase">Shaxsiy ID</div>
          <div className="text-2xl font-black text-[#5A4FE3] my-0.5">{me?.publicId}</div>
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(me?.publicId); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="px-3 py-1 rounded-lg bg-white text-[#5A4FE3] text-xs font-bold border border-indigo-200"
          >
            {copied ? "✓ Nusxalandi" : "ID nusxalash"}
          </button>
        </div>
      </div>

      {/* 2. Telefon raqamini ulash va SMS kod bilan tasdiqlash */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Telefon raqamini ulash va tasdiqlash</h3>
            <p className="text-xs text-slate-500">SMS kod orqali raqamingizni tasdiqlang</p>
          </div>
          {me?.phoneVerified ? (
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">✓ Tasdiqlangan ({me.phone})</span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Tasdiqlanmagan</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
          <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="+998901234567" className="flex-1 px-4 py-2.5 rounded-xl border text-sm" />
          <button type="button" onClick={handleSendOtp} className="px-5 py-2.5 rounded-xl bg-[#5A4FE3] text-white text-xs font-bold">
            Kod yuborish
          </button>
        </div>

        {phoneMsg && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-semibold">
            {phoneMsg} {demoOtpHint && <span className="ml-2 px-2 py-0.5 rounded bg-white font-black text-[#5A4FE3]">Kod: {demoOtpHint}</span>}
          </div>
        )}

        {otpSent && (
          <div className="flex gap-2.5 max-w-sm">
            <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="6 xonali kod" maxLength={6} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold tracking-widest" />
            <button type="button" onClick={handleVerifyOtp} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">Tasdiqlash</button>
          </div>
        )}
      </div>

      {/* 3. Asosiy ma'lumotlar, @username va Rolni tasdiqlash (Diplom / Guvohnoma) */}
      <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <h3 className="text-base font-extrabold text-slate-900">Profil sozlamalari va Maqomni tasdiqlash</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Foydalanuvchi nomi (@username) — oson kirish va qidiruv uchun *</label>
            <div className="flex items-center border rounded-xl overflow-hidden bg-slate-50">
              <span className="px-3 text-sm font-black text-[#5A4FE3]">@</span>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
                placeholder="ozodbek_dev"
                className="w-full px-2 py-2.5 bg-white text-sm outline-none font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Tug‘ilgan sana</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Ism *</label>
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Familiya *</label>
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Otasining ismi</label>
            <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Jinsi</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white">
              <option value="MALE">Erkak</option>
              <option value="FEMALE">Ayol</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Viloyat / Shahar</label>
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Toshkent shahri" className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Tuman</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Yunusobod" className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
          </div>
        </div>

        {/* ROLGA QARAB TASDIQLASH BLOKI */}
        {me?.role === "TEACHER" ? (
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#4338CA]">🎓 O‘qituvchi malakasini tasdiqlash</h4>
              {me?.teacherProfile?.isVerified && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">✓ Tasdiqlangan</span>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qayerda ishlaysiz (Maktab / Markaz) *</label>
                <input
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  placeholder="Masalan: 110-son ixtisoslashtirilgan maktab"
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ish tajribangiz (yil) *</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">O‘qitadigan faningiz *</label>
                <input
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="Informatika, Matematika"
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Elektron diplom yuklash (PDF yoki Rasm) *</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="px-4 py-2.5 rounded-xl bg-white border border-indigo-200 hover:bg-indigo-50 text-[#5A4FE3] text-xs font-bold cursor-pointer">
                  📄 Elektron diplomni tanlash
                  <input type="file" accept=".pdf,image/*" onChange={(e) => handleDocUpload(e, "DIPLOMA")} className="hidden" />
                </label>
                {(diplomaFileName || diplomaUrl) && (
                  <span className="text-xs font-bold text-emerald-700">
                    ✓ {diplomaFileName || "Elektron diplom yuklangan"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-emerald-900">🎒 O‘quvchi ekanligini tasdiqlash</h4>
              {me?.studentProfile?.isVerified && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">✓ Tasdiqlangan</span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qaysi maktab / litseyda o‘qiysiz *</label>
                <input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Masalan: Toshkent shahar 50-maktab"
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sinfingiz / Kursingiz *</label>
                <input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="9-sinf"
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">O‘quvchi guvohnomasi yoki maktab ma’lumotnomasi (Rasm / PDF) *</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="px-4 py-2.5 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-xs font-bold cursor-pointer">
                  📎 Guvohnoma / Ma’lumotnoma yuklash
                  <input type="file" accept=".pdf,image/*" onChange={(e) => handleDocUpload(e, "STUDENT")} className="hidden" />
                </label>
                {(studentDocName || studentDocUrl) && (
                  <span className="text-xs font-bold text-emerald-700">
                    ✓ {studentDocName || "Tasdiqlovchi hujjat yuklangan"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">O‘zingiz haqingizda (Bio)</label>
          <textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Qiziqishlaringiz va maqsadlaringiz..." className="w-full px-3.5 py-2.5 rounded-xl border text-sm" />
        </div>

        <button type="submit" disabled={saving} className="px-7 py-3.5 rounded-xl bg-[#5A4FE3] hover:bg-[#4338CA] text-white font-bold text-sm transition">
          {saving ? "Saqlanmoqda..." : "Barcha o‘zgarishlarni saqlash"}
        </button>
      </form>
    </div>
  );
}