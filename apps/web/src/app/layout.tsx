import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KasbYo‘l AI — Ta’lim va Kasb Yo‘naltirish Platformasi",
  description: "8–11-sinf o‘quvchilari, o‘qituvchilar va maktab adminlari uchun yagona platforma",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
