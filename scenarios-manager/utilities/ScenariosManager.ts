import { Scenario, ScenarioCondition, ScenarioStep, ScenarioStepCondition, ScenarioStepType } from '@prisma/client';
import devicesClient from 'devices-client/client';
import omit from 'lodash/omit';

import prisma from 'db/prisma';

import { AddScenarioStepPayload } from 'scenarios-manager/types/scenario';

import { getStepRunParams } from 'scenarios-manager/utilities/payload';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { delay } from 'utilities/promise';

export type AddScenarioOptions = {
  name: string;
};

export default class ScenariosManager {
  static readonly defaultAddScenarioStepPayload: AddScenarioStepPayload = {
    scenarioId: 0,
    name: '',
    runParams: {
      type: ScenarioStepType.RunScenario,
      scenarioId: 0,
    },
  };

  async addScenario(options: AddScenarioOptions): Promise<Scenario> {
    return prisma.scenario.create({
      data: {
        ...options,
        isActive: true,
      },
    });
  }

  async addScenarioStep(addStepPayload: AddScenarioStepPayload): Promise<ScenarioStep> {
    return prisma.$transaction(async (tx) => {
      const stepsCount = await tx.scenarioStep.count({
        where: {
          scenarioId: addStepPayload.scenarioId,
        },
      });

      return tx.scenarioStep.create({
        data: {
          name: addStepPayload.name,
          scenarioId: addStepPayload.scenarioId,
          position: stepsCount,
          isActive: true,
          type: addStepPayload.runParams.type,
          payload: omit(addStepPayload.runParams, 'type'),
        },
      });
    });
  }

  async areConditionsMet(conditions: (ScenarioCondition | ScenarioStepCondition)[]): Promise<boolean> {
    return (
      await Promise.all(
        conditions.map(async ({ isActive }) => {
          if (!isActive) {
            return true;
          }

          // TODO: implement
          return true;
        }),
      )
    ).every(Boolean);
  }

  async deleteScenario(scenarioId: number): Promise<void> {
    await prisma.scenario.delete({
      where: {
        id: scenarioId,
      },
    });
  }

  async deleteScenarioStep(scenarioStepId: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const scenarioStep = await tx.scenarioStep.findUnique({
        where: {
          id: scenarioStepId,
        },
      });

      if (!scenarioStep) {
        throw new CustomError(ErrorCode.NOT_FOUND, 'Шаг не найден');
      }

      await Promise.all([
        tx.scenarioStep.delete({
          where: {
            id: scenarioStepId,
          },
        }),
        tx.scenarioStep.updateMany({
          where: {
            scenarioId: scenarioStep.scenarioId,
            position: {
              gt: scenarioStep.position,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        }),
      ]);
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

  async editScenarioStep(scenarioStepId: number, data: Partial<ScenarioStep>): Promise<void> {
    await prisma.scenarioStep.update({
      where: {
        id: scenarioStepId,
      },
      data: {
        ...data,
        payload: data.payload ?? undefined,
      },
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

  async getScenarioStep(scenarioStepId: number): Promise<ScenarioStep> {
    const scenarioStep = await prisma.scenarioStep.findUnique({
      where: {
        id: scenarioStepId,
      },
    });

    if (!scenarioStep) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Шаг не найден');
    }

    return scenarioStep;
  }

  async isNameAllowed(name: string): Promise<boolean> {
    return !(await prisma.scenario.findFirst({
      where: {
        name,
      },
    }));
  }

  async isStepNameAllowed(scenarioId: number, name: string): Promise<boolean> {
    return !(await prisma.scenarioStep.findFirst({
      where: {
        scenarioId,
        name,
      },
    }));
  }

  async runScenario(scenarioId: number): Promise<void> {
    const scenario = await prisma.scenario.findUnique({
      where: {
        id: scenarioId,
      },
      include: {
        conditions: true,
        steps: {
          orderBy: {
            position: 'asc',
          },
          include: {
            conditions: true,
          },
        },
      },
    });

    if (!scenario) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Сценарий не найден');
    }

    if (!scenario.isActive) {
      throw new CustomError(ErrorCode.NOT_ACTIVE, 'Сценарий не активен');
    }

    if (!(await this.areConditionsMet(scenario.conditions))) {
      throw new CustomError(ErrorCode.CONDITIONS_NOT_MET, 'Условия не выполнены');
    }

    for (const step of scenario.steps) {
      await this.runScenarioStep(step);
    }
  }

  async runScenarioStep(step: ScenarioStep & { conditions: ScenarioStepCondition[] }): Promise<void> {
    if (!step.isActive || !(await this.areConditionsMet(step.conditions))) {
      return;
    }

    const runParams = getStepRunParams(step);

    if (!runParams) {
      return;
    }

    if (runParams.type === ScenarioStepType.RunScenario) {
      await this.runScenario(runParams.scenarioId);
    } else if (runParams.type === ScenarioStepType.Wait) {
      await delay(runParams.period);
    } else if (runParams.type === ScenarioStepType.TurnOnDevice) {
      await devicesClient.turnOnDevice(runParams.deviceId);
    } else if (runParams.type === ScenarioStepType.TurnOffDevice) {
      await devicesClient.turnOffDevice(runParams.deviceId);
    }
  }
}
