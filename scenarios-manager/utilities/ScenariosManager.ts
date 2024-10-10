import { Scenario } from '@prisma/client';

import prisma from 'db/prisma';

import CustomError, { ErrorCode } from 'utilities/CustomError';

export type AddScenarioOptions = {
  name: string;
};

export default class ScenariosManager {
  async addScenario(options: AddScenarioOptions): Promise<Scenario> {
    return prisma.scenario.create({
      data: {
        ...options,
        isActive: true,
      },
    });
  }

  async deleteScenario(scenarioId: number): Promise<void> {
    await prisma.scenario.delete({
      where: {
        id: scenarioId,
      },
    });
  }

  async editScenario(scenarioId: number, data: Partial<Scenario>): Promise<void> {
    await prisma.scenario.update({
      where: {
        id: scenarioId,
      },
      data,
    });
  }

  async getActiveScenarios(): Promise<Scenario[]> {
    return prisma.scenario.findMany({
      where: {
        isActive: true,
      },
    });
  }

  async getScenario(scenarioId: number): Promise<Scenario> {
    const scenario = await prisma.scenario.findUnique({
      where: {
        id: scenarioId,
      },
    });

    if (!scenario) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Сценарий не найден');
    }

    return scenario;
  }

  async isNameAllowed(name: string): Promise<boolean> {
    return !(await prisma.scenario.findFirst({
      where: {
        name,
      },
    }));
  }
}
