"use client";

export function TestModeBanner() {
  return (
    <div className="w-full bg-amber-500 text-slate-950 text-xs sm:text-sm font-medium px-4 py-2 text-center shadow-sm z-50 relative">
      <span>
        ⚠️ Sayt test rejimida ishlayapti. Savollar yoki takliflar bo‘lsa{" "}
        <a
          href="https://t.me/renmaone"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-bold hover:text-slate-800"
        >
          adminga murojaat qiling
        </a>
        .
      </span>
    </div>
  );
}
