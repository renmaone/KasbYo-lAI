import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CareerService } from "./career.service";
import { AiMentorService } from "./ai-mentor.service";

@ApiTags("Career & AI Mentor")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("career")
export class CareerController {
  constructor(
    private readonly careerService: CareerService,
    private readonly aiMentorService: AiMentorService,
  ) {}

  @Get("questions")
  getQuestions() {
    return this.careerService.getQuestions();
  }

  @Get("careers")
  getCareers(@Query("search") search?: string, @Query("category") category?: string) {
    return this.careerService.getCareers(search, category);
  }

  @Post("assess")
  assess(@Req() req: any, @Body() body: { answers: { questionId: string; score: number }[] }) {
    return this.careerService.submitAssessment(req.user.sub, body.answers || []);
  }

  @Get("results/me")
  myResults(@Req() req: any) {
    return this.careerService.getMyResults(req.user.sub);
  }

  @Post("ai-mentor/chat")
  chat(@Req() req: any, @Body() body: { message: string }) {
    return this.aiMentorService.chat(req.user.sub, body.message);
  }
}
