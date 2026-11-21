import { Injectable } from "@nestjs/common";
import { RiasecType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CareerService {
  constructor(private readonly prisma: PrismaService) {}

  getQuestions() {
    return this.prisma.interestQuestion.findMany({
      where: { isActive: true },
      orderBy: { orderNum: "asc" },
    });
  }

  getCareers(search?: string, category?: string) {
    return this.prisma.career.findMany({
      where: {
        ...(category && category !== "ALL" ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { title: "asc" },
    });
  }

  async submitAssessment(studentId: string, answers: { questionId: string; score: number }[]) {
    const questions = await this.prisma.interestQuestion.findMany();
    const qMap = new Map(questions.map((q) => [q.id, q.category]));
    const totals: Record<RiasecType, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    for (const ans of answers) {
      const cat = qMap.get(ans.questionId);
      if (cat) totals[cat] += Math.max(0, Math.min(5, ans.score));
    }

    const sorted = (Object.entries(totals) as [RiasecType, number][]).sort((a, b) => b[1] - a[1]);
    const topTwo = [sorted[0][0], sorted[1][0]];
    const topCode = topTwo.join("-");

    const recommendedCareers = await this.prisma.career.findMany({
      where: { riasecCodes: { hasSome: topTwo } },
      take: 6,
    });

    const summary = `Sizning asosiy qiziqish yo‘nalishlaringiz: ${topCode}. Bu natija yakuniy qaror emas, balki kelajak kasbingizni ongli tanlash uchun ilmiy tavsiyadir.`;

    const result = await this.prisma.interestResult.create({
      data: {
        studentId,
        scoresJson: totals,
        topCode,
        summary,
      },
    });

    return { result, recommendedCareers, disclaimer: "Ushbu natija faqat tavsiya xarakteriga ega." };
  }

  getMyResults(studentId: string) {
    return this.prisma.interestResult.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
  }
}
