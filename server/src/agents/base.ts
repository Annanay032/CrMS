import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import type { AgentType } from '../types/enums.js';

export interface AgentInput {
  [key: string]: unknown;
}

export interface AgentResult {
  output: unknown;
  tokensUsed?: number;
}

export abstract class BaseAgent {
  abstract readonly agentType: AgentType;
  abstract readonly name: string;

  abstract run(input: AgentInput): Promise<AgentResult>;

  async execute(userId: string, input: AgentInput): Promise<AgentResult> {
    const task = await prisma.agentTask.create({
      data: {
        agentType: this.agentType,
        userId,
        input: input as any,
        status: 'RUNNING',
      },
    });

    try {
      logger.info(`Agent [${this.name}] started task ${task.id}`);
      const result = await this.run(input);

      await prisma.agentTask.update({
        where: { id: task.id },
        data: {
          output: result.output as any,
          tokensUsed: result.tokensUsed,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      logger.info(`Agent [${this.name}] completed task ${task.id}, tokens: ${result.tokensUsed ?? 0}`);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await prisma.agentTask.update({
        where: { id: task.id },
        data: { status: 'FAILED', error: message, completedAt: new Date() },
      });
      logger.error(`Agent [${this.name}] failed task ${task.id}: ${message}`);
      throw err;
    }
  }
}
