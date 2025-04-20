import { Body, Controller, Get, Post } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { CreatePromptDto } from './dto/createPrompt.dto';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('generate')
  async generate(@Body() body: CreatePromptDto) {
    const { prompt } = body;
    const response = await this.openaiService.generateResponse(prompt, false);
    return { response };
  }

  @Post('regenerate')
  async regenerate(@Body() body: CreatePromptDto) {
    const { prompt } = body;
    const response = await this.openaiService.generateResponse(prompt, true);
    return { response };
  }

  @Get('history')
  async getHistory() {
    return this.openaiService.getPromptHistory();
  }

  @Get('metrics')
  async getMetrics() {
    return this.openaiService.getMetrics();
  }
}
