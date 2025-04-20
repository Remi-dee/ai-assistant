import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

@Injectable()
export class OpenaiService {
  private openai: OpenAI;
  private prisma = new PrismaClient();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateResponse(prompt: string, regenerated = false): Promise<string> {
    const model = 'gpt-4o-mini'; // or 'gpt-4'
    const start = performance.now();

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const end = performance.now();
    const latencyMs = Math.round(end - start);

    const response = completion.choices[0].message?.content ?? '';

    // Save prompt log
    await this.prisma.promptLog.create({
      data: {
        prompt,
        response,
        model,
        regenerated,
        latencyMs,
      },
    });

    return response;
  }

  async getPromptHistory() {
    return this.prisma.promptLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getMetrics() {
    const [
      totalPrompts,
      avgLatency,
      promptsPerDay,
      topPrompts,
      slowestPrompts,
    ] = await Promise.all([
      this.prisma.promptLog.count(),
      this.prisma.promptLog.aggregate({
        _avg: { latencyMs: true },
      }),
      this.prisma.$queryRaw<
        { date: string; count: bigint }[]
      >`SELECT DATE(createdAt) as date, COUNT(*) as count FROM PromptLog GROUP BY date ORDER BY date DESC LIMIT 7`,
      this.prisma.$queryRaw<
        { prompt: string; count: bigint }[]
      >`SELECT prompt, COUNT(*) as count FROM PromptLog GROUP BY prompt ORDER BY count DESC LIMIT 5`,
      this.prisma.promptLog.findMany({
        orderBy: { latencyMs: 'desc' },
        where: { latencyMs: { not: null } },
        take: 5,
      }),
    ]);

    return {
      totalPrompts,
      avgLatency: avgLatency._avg.latencyMs,
      promptsPerDay: promptsPerDay.map((entry) => ({
        date: entry.date,
        count: Number(entry.count),
      })),
      topPrompts: topPrompts.map((entry) => ({
        prompt: entry.prompt,
        count: Number(entry.count),
      })),
      slowestPrompts,
    };
  }
}
