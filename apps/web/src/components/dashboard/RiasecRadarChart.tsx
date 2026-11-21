"use client";
interface RiasecScores {
  R?: number;
  I?: number;
  A?: number;
  S?: number;
  E?: number;
  C?: number;
}

const LABELS: { key: keyof RiasecScores; title: string; desc: string }[] = [
  { key: "R", title: "Realistik (R)", desc: "Texnika, muhandislik, amaliy ishlar" },
  { key: "I", title: "Tadqiqotchi (I)", desc: "IT, tahlil, ilm-fan, dasturlash" },
  { key: "A", title: "Artistik (A)", desc: "Dizayn, ijod, san'at, media" },
  { key: "S", title: "Ijtimoiy (S)", desc: "Ta'lim, tibbiyot, yordam berish" },
  { key: "E", title: "Tadbirkor (E)", desc: "Biznes, boshqaruv, liderlik" },
  { key: "C", title: "Konvensional (C)", desc: "Moliya, hisob-kitob, tizimlilik" },
];

export function RiasecRadarChart({ scores }: { scores: RiasecScores }) {
  const cx = 150;
  const cy = 150;
  const maxR = 100;
  const maxScore = 35; // 7 savol * 5 ball

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const r = (Math.min(value, maxScore) / maxScore) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = LABELS.map((item, idx) => {
    const val = Number(scores?.[item.key] || 0);
    const pt = getPoint(idx, val);
    return `${pt.x},${pt.y}`;
  }).join(" ");

  return (
    <div className="grid md:grid-cols-2 gap-6 items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 300 300" className="w-full max-w-[290px]">
          {[0.25, 0.5, 0.75, 1].map((scale, sIdx) => {
            const ring = LABELS.map((_, idx) => {
              const pt = getPoint(idx, maxScore * scale);
              return `${pt.x},${pt.y}`;
            }).join(" ");
            return (
              <polygon
                key={sIdx}
                points={ring}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            );
          })}

          {LABELS.map((item, idx) => {
            const outer = getPoint(idx, maxScore);
            const labelPt = getPoint(idx, maxScore + 6);
            return (
              <g key={item.key}>
                <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#E2E8F0" strokeWidth="1" />
                <text
                  x={labelPt.x}
                  y={labelPt.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-700 font-extrabold text-xs"
                >
                  {item.key}
                </text>
              </g>
            );
          })}

          <polygon
            points={polygonPoints}
            fill="rgba(90, 79, 227, 0.22)"
            stroke="#5A4FE3"
            strokeWidth="2.5"
          />

          {LABELS.map((item, idx) => {
            const val = Number(scores?.[item.key] || 0);
            const pt = getPoint(idx, val);
            return (
              <circle
                key={item.key}
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#5A4FE3"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
        <span className="text-xs text-slate-400 mt-1">RIASEC Psixometrik Profil Xaritasi</span>
      </div>

      <div className="space-y-3">
        {LABELS.map((item) => {
          const val = Number(scores?.[item.key] || 0);
          const pct = Math.round((val / maxScore) * 100);
          return (
            <div key={item.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800">{item.title}</span>
                <span className="font-bold text-[#5A4FE3]">{val} / {maxScore} ({pct}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5A4FE3] to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
