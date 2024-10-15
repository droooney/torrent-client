import {
  Scenario,
  ScenarioCondition,
  ScenarioStep,
  ScenarioStepCondition,
  ScenarioStepType,
  ScenarioTrigger,
  ScenarioTriggerType,
} from '@prisma/client';
import { CronJob } from 'cron';
import devicesClient from 'devices-client/client';
import omit from 'lodash/omit';
import scheduler from 'scheduler/scheduler';

import prisma from 'db/prisma';

import { AddScenarioStepPayload } from 'scenarios-manager/types/step';
import { AddScenarioTriggerPayload } from 'scenarios-manager/types/trigger';

import { getStepRunParams, getTriggerParams } from 'scenarios-manager/utilities/payload';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForLogging } from 'utilities/error';
import { delay } from 'utilities/promise';

export type AddScenarioOptions = {
  name: string;
};

type ScheduledScenario = {
  scenarioId: number;
  cronJob: CronJob;
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

  static readonly defaultAddScenarioTriggerPayload: AddScenarioTriggerPayload = {
    scenarioId: 0,
    name: '',
    params: {
      type: ScenarioTriggerType.Schedule,
      schedule: '* * * * * *',
    },
  };

  private _scheduledScenarios = new Map<number, ScheduledScenario>();

  constructor() {
    (async () => {
      const scenarios = await prisma.scenario.findMany({
        where: {
          triggers: {
            some: {
              type: ScenarioTriggerType.Schedule,
            },
          },
        },
        include: {
          triggers: true,
        },
      });

      scenarios.forEach((scenario) => {
        scenario.triggers.forEach((trigger) => {
          this.tryRegisterTrigger(trigger);
        });
      });
    })().catch((err) => {
      console.log(prepareErrorForLogging(new Error('Unable to load scheduled scenarios', { cause: err })));
    });
  }

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

  async addScenarioTrigger(addTriggerPayload: AddScenarioTriggerPayload): Promise<ScenarioTrigger> {
    const trigger = await prisma.scenarioTrigger.create({
      data: {
        name: addTriggerPayload.name,
        scenarioId: addTriggerPayload.scenarioId,
        isActive: true,
        type: addTriggerPayload.params.type,
        payload: omit(addTriggerPayload.params, 'type'),
      },
    });

    this.tryRegisterTrigger(trigger);

    return trigger;
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

  async deleteScenarioTrigger(triggerId: number): Promise<void> {
    await prisma.scenarioTrigger.delete({
      where: {
        id: triggerId,
      },
    });

    const scheduledScenario = this._scheduledScenarios.get(triggerId);

    scheduledScenario?.cronJob.stop();

    this._scheduledScenarios.delete(triggerId);
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

  async editScenarioTrigger(scenarioTriggerId: number, data: Partial<ScenarioTrigger>): Promise<void> {
    const trigger = await prisma.scenarioTrigger.update({
      where: {
        id: scenarioTriggerId,
      },
      data: {
        ...data,
        payload: data.payload ?? undefined,
      },
    });

    const triggerParams = getTriggerParams(trigger);

    if (triggerParams?.type !== ScenarioTriggerType.Schedule) {
      return;
    }

    const scheduledScenario = this._scheduledScenarios.get(trigger.id);

    if (scheduledScenario?.cronJob.cronTime.toString() === triggerParams.schedule) {
      return;
    }

    scheduledScenario?.cronJob.stop();

    this._scheduledScenarios.delete(trigger.id);

    this.tryRegisterTrigger(trigger);
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

  tryRegisterTrigger(trigger: ScenarioTrigger): void {
    const triggerParams = getTriggerParams(trigger);

    if (triggerParams?.type !== ScenarioTriggerType.Schedule) {
      return;
    }

    this._scheduledScenarios.set(trigger.id, {
      scenarioId: trigger.scenarioId,
      cronJob: scheduler.addJob({
        schedule: triggerParams.schedule,
        callback: () => this.runScenario(trigger.scenarioId),
      }),
    });
  }
}
