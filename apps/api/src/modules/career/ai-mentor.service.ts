import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AiMentorService {
  constructor(private readonly prisma: PrismaService) {}

  async chat(userId: string, message: any) {
    const promptText =
      typeof message === "string"
        ? message
        : message?.message || message?.prompt || JSON.stringify(message);

    const user: any = await this.prisma.user
      .findUnique({
        where: { id: userId },
        include: { profile: true },
      })
      .catch(() => null);

    const latestRiasec: any = await (this.prisma as any).riasecAttempt
      ?.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => null);

    const fullName =
      [user?.profile?.firstName, user?.profile?.lastName]
        .filter(Boolean)
        .join(" ") || "O\u2018quvchi";
    const riasecCode = latestRiasec?.topCode || latestRiasec?.hollandCode || "I-R-E (Tahliliy va Texnik)";
    const grade = user?.profile?.grade || "Maktab/Litsey";
    const region = user?.profile?.region || "O\u2018zbekiston";

    const apiKey = process.env.GEMINI_API_KEY;
    const systemPrompt = `Sen KasbYo\u2018l ta\u2019lim platformasining professional AI Murabbiyisan.
O\u2018quvchi: ${fullName}, Hudud: ${region}, Bosqich: ${grade}, RIASEC kodi: ${riasecCode}.
O\u2018zbek tilida samimiy, qisqa va amaliy javob ber. O\u2018zbekistondagi OTMlar va aniq yo\u2018l xaritasini tavsiya qil.`;

    if (apiKey) {
      const fastModels = ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-3.8-flash"];
      for (const model of fastModels) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [{ text: `${systemPrompt}\n\nSavol: ${promptText}` }],
                  },
                ],
              }),
            },
          );
          clearTimeout(timer);
          const data: any = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return { reply: text, answer: text, message: text };
          }
        } catch {}
      }
    }

    const q = promptText.toLowerCase();
    let smartReply = `Assalomu alaykum, ${fullName}! Men KasbYo\u2018l AI Murabbiyingizman.\n\nSizning profilingiz (${region}, ${grade}, RIASEC: ${riasecCode}) asosida sizga kasb tanlash, O\u2018zbekistondagi nufuzli OTMlarga (TATU, INHA, WIUT, O\u2018zMU, TDYU) tayyorlanish va shaxsiy o\u2018quv rejangizni tuzishda yordam beraman. Qaysi kasb yoki yo\u2018nalish sizni ko\u2018proq qiziqtiradi?`;

    if (q.includes("it") || q.includes("dastur") || q.includes("reja") || q.includes("kasb") || q.includes("otm")) {
      smartReply = `Salom, ${fullName}! Sizning ${riasecCode} yo\u2018nalishingiz bo\u2018yicha 6 oylik individual yo\u2018l xaritasi:\n\n1. **Tavsiya etiladigan OTMlar:** TATU, Toshkentdagi INHA universiteti, Vestminster (WIUT) va Yangi O\u2018zbekiston universiteti.\n2. **Asosiy fanlar:** Matematika, Ingliz tili (IELTS 6.5+ maqsad) va Informatika/Dasturlash asoslari.\n3. **Amaliy qadam:** KasbYo\u2018l sinflaringizdagi vazifalarni muntazam topshirib, reyting ballaringizni oshiring va yakuniy sertifikatga ega bo\u2018ling!`;
    }

    return { reply: smartReply, answer: smartReply, message: smartReply };
  }
}