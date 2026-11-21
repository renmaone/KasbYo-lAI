"use client";
export function CareerMarketModal({ career, onClose, onAskAi }: { career: any; onClose: () => void; onAskAi: (careerTitle: string) => void }) {
  if (!career) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#5A4FE3] text-xs font-bold">
                {career.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                Kod: {career.riasecCodes?.join("-")}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">{career.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{career.description}</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-xs font-bold text-emerald-700 uppercase">O‘zbekiston bozoridagi maosh</div>
            <div className="text-lg font-extrabold text-emerald-900 mt-1">{career.salaryRange}</div>
            <div className="text-xs text-emerald-600 mt-1">Talab darajasi: Yuqori (2026 prognozi)</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#EEF2FF]/70 border border-indigo-100">
            <div className="text-xs font-bold text-[#4338CA] uppercase">Asosiy maktab fanlari</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {career.relatedSubjects?.map((sub: string, i: number) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white text-xs font-semibold text-slate-700 border border-indigo-100">
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Tavsiya etilgan OTM va Ta‘lim yo‘nalishlari</h4>
          <div className="grid sm:grid-cols-2 gap-2">
            {career.educationPaths?.map((edu: string, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5A4FE3]" />
                {edu}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onAskAi(career.title);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#5A4FE3] hover:bg-[#4338CA] text-white text-sm font-bold transition"
          >
            AI Murabbiydan yo‘l xaritasi so‘rash
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
