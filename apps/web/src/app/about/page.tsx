import Link from "next/link";

const riasecTypes = [
  {
    code: "R",
    title: "Realistic (Amaliy / Texnik)",
    desc: "Texnika, mexanizmlar, elektronika, qurilish va qo‘l mehnati bilan aniq natija yaratishni yoqtiradigan insonlar."
  },
  {
    code: "I",
    title: "Investigative (Tadqiqotchi / Analitik)",
    desc: "Ilm-fan, dasturlash, matematika, murakkab muammolarni chuqur tahlil qilish va mantiqiy yechim topishga moyil insonlar."
  },
  {
    code: "A",
    title: "Artistic (Ijodkor / Dizayner)",
    desc: "Dizayn, san’at, musiqa, kontent yaratish va qoliplardan tashqarida noodatiy g‘oyalar o‘ylab topuvchi shaxslar."
  },
  {
    code: "S",
    title: "Social (Ijtimoiy / Yordam beruvchi)",
    desc: "Odamlar bilan ishlash, ta’lim berish, tibbiyot, psixologiya va jamiyatga foyda keltirishni maqsad qilganlar."
  },
  {
    code: "E",
    title: "Enterprising (Tadbirkor / Yetakchi)",
    desc: "Loyihalarni boshqarish, jamoaga yetakchilik qilish, biznes boshlash va muzokaralar olib borishga qiziqadiganlar."
  },
  {
    code: "C",
    title: "Conventional (Tartibli / Moliyaviy-ma’muriy)",
    desc: "Aniqlik, moliya, buxgalteriya, hujjatlar va tizimli rejalashtirish asosida ishlashni afzal ko‘ruvchi mutaxassislar."
  }
];

const team = [
  {
    name: "Azima Toshpulatova",
    role: "Asoschi (Founder)",
    phoneDisplay: "+998 92 062 80 55",
    phoneHref: "tel:+998920628055",
    telegram: "@hsnddnva_one",
    telegramHref: "https://t.me/hsnddnva_one"
  },
  {
    name: "Ozodbek Hamdamov",
    role: "Full-Stack Dasturchi",
    phoneDisplay: "+998 70 038 90 55",
    phoneHref: "tel:+998700389055",
    telegram: "@renmaone",
    telegramHref: "https://t.me/renmaone"
  },
  {
    name: "Xo‘janiyozov Kamoliddin",
    role: "AI Mutaxassis",
    phoneDisplay: null,
    phoneHref: null,
    telegram: null,
    telegramHref: null
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Orqaga qaytish */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            ← Bosh sahifaga qaytish
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
          >
            Kabinetga o‘tish
          </Link>
        </div>

        {/* Platforma haqida */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-4">
          <span className="inline-block text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
            Sayt haqida
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            KasbYo‘l AI — kelajak kasbingizni ilmiy va aqlli tanlash platformasi
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            <strong>KasbYo‘l AI</strong> — o‘quvchilar, abituriyentlar va talabalarga o‘z qiziqishlari,
            qobiliyatlari hamda shaxsiyat turiga eng mos keladigan zamonaviy kasblarni aniqlashda
            yordam beruvchi sun’iy intellektga asoslangan ta’lim va karyera yo‘naltirish platformasi.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="font-bold text-slate-900 mb-1">Ilmiy Diagnostika</div>
              <p className="text-sm text-slate-600">
                Xalqaro tan olingan Holland RIASEC metodikasi asosida shaxsiyat va qiziqishlar tahlili.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="font-bold text-slate-900 mb-1">AI Karyera Murabbiy</div>
              <p className="text-sm text-slate-600">
                Sun’iy intellekt yordamida shaxsiy rivojlanish rejasi, OTM va kurslar bo‘yicha tavsiyalar.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="font-bold text-slate-900 mb-1">Kasblar Katalogi</div>
              <p className="text-sm text-slate-600">
                Zamonaviy kasblar, talab qilinadigan ko‘nikmalar, fanlar va o‘rtacha maoshlar bazasi.
              </p>
            </div>
          </div>
        </section>

        {/* RIASEC nima? */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6">
          <div className="space-y-2">
            <span className="inline-block text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
              Metodologiya
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Holland RIASEC modeli nima?
            </h2>
            <p className="text-slate-600 leading-relaxed">
              <strong>RIASEC</strong> — amerikalik psixolog Jon Holland (John L. Holland) tomonidan
              ishlab chiqilgan dunyodagi eng mashhur kasbga yo‘naltirish nazariyasi. Unga ko‘ra, har
              bir insonning kasbiy qiziqishlari 6 ta asosiy tip kombinatsiyasidan tashkil topadi:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riasecTypes.map((item) => (
              <div
                key={item.code}
                className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70"
              >
                <div className="w-11 h-11 shrink-0 rounded-xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center">
                  {item.code}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Yaratuvchilar jamoasi */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6">
          <div className="space-y-2">
            <span className="inline-block text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
              Jamoa
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Platforma yaratuvchilari
            </h2>
            <p className="text-slate-600">
              KasbYo‘l AI loyihasi ustida ishlagan asoschi va mutaxassislar bilan bog‘lanish uchun ma’lumotlar:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {team.map((member) => (
              <div
                key={member.name}
                className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center mb-3">
                    {member.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                  <p className="text-sm font-semibold text-indigo-600 mt-0.5">{member.role}</p>
                </div>

                {(member.phoneDisplay || member.telegram) ? (
                  <div className="space-y-2 pt-3 border-t border-slate-200 text-sm">
                    {member.phoneDisplay && (
                      <div>
                        <span className="text-slate-500 block text-xs">Telefon raqam:</span>
                        <a
                          href={member.phoneHref}
                          className="font-semibold text-slate-800 hover:text-indigo-600"
                        >
                          {member.phoneDisplay}
                        </a>
                      </div>
                    )}
                    {member.telegram && (
                      <div>
                        <span className="text-slate-500 block text-xs">Telegram:</span>
                        <a
                          href={member.telegramHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sky-600 hover:underline"
                        >
                          {member.telegram}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-200 text-xs text-slate-500">
                    AI modellar va tavsiya tizimi arxitektori
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
