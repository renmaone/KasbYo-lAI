"use client";

import Link from "next/link";

export function TestModeBanner() {
  return (
    <div className="w-full bg-amber-500 text-slate-950 text-xs sm:text-sm font-medium px-4 py-2 shadow-sm z-50 relative">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <span>
          ⚠️ Sayt test rejimida ishlayapti. Savollar yoki takliflar bo‘lsa{" "}
          <a
            href="https://t.me/renmaone"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold hover:text-slate-800"
          >
            adminga murojaat qiling (@renmaone)
          </a>
          .
        </span>
        <Link
          href="/about"
          className="inline-flex items-center gap-1 bg-slate-950 text-white text-xs font-semibold px-3 py-1 rounded-full hover:bg-slate-800 transition"
        >
          ℹ️ Sayt haqida
        </Link>
      </div>
    </div>
  );
}
