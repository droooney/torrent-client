import {
  Device,
  LogicalOperator,
  Scenario,
  ScenarioCondition,
  ScenarioConditionType,
  ScenarioStep,
  ScenarioStepCondition,
  ScenarioStepType,
  ScenarioTrigger,
  ScenarioTriggerType,
} from '@prisma/client';
import devicesClient from 'devices-client/client';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import scheduler from 'scheduler/scheduler';

import prisma from 'db/prisma';
import { PrismaTransaction, runInTransaction } from 'db/utilities/transaction';

import { AddScenarioStepPayload } from 'scenarios-manager/types/step';
import { AddScenarioTriggerPayload } from 'scenarios-manager/types/trigger';

import { getConditionParams, getStepRunParams, getTriggerParams } from 'scenarios-manager/utilities/payload';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForLogging } from 'utilities/error';
import { runTask } from 'utilities/process';
import { delay } from 'utilities/promise';

export type AddScenarioOptions = {
  name: string;
};

type RegisteredTrigger = {
  unregister: () => unknown;
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

  private _registeredTriggers = new Map<number, RegisteredTrigger>();

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
          this.registerTrigger(trigger);
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

    this.registerTrigger(trigger);

    return trigger;
  }

  async areConditionsMet(
    conditions: (ScenarioCondition | ScenarioStepCondition)[],
    conditionsOperator: LogicalOperator,
  ): Promise<boolean> {
    return (
      await Promise.all(
        conditions.map(async (condition) => {
          if (!condition.isActive) {
            return true;
          }

          const params = getConditionParams(condition);

          if (!params) {
            return false;
          }

          if (params.type === ScenarioConditionType.Time) {
            // TODO: implement

            return true;
          }

          if (params.type === ScenarioConditionType.EmptyHome) {
            const onlineDevicesInfo = await devicesClient.getOnlineDevicesInfo();

            return onlineDevicesInfo.every(({ usedForAtHomeDetection }) => !usedForAtHomeDetection);
          }

          if (params.type === ScenarioConditionType.NonEmptyHome) {
            const onlineDevicesInfo = await devicesClient.getOnlineDevicesInfo();

            return onlineDevicesInfo.some(({ usedForAtHomeDetection }) => usedForAtHomeDetection);
          }

          if (params.type === ScenarioConditionType.DeviceOnline) {
            return (await devicesClient.getDeviceInfo(params.deviceId)).state.online;
          }

          if (params.type === ScenarioConditionType.DeviceOffline) {
            return !(await devicesClient.getDeviceInfo(params.deviceId)).state.online;
          }

          if (params.type === ScenarioConditionType.DevicePowerOn) {
            return (await devicesClient.getDeviceInfo(params.deviceId)).state.power === true;
          }

          if (params.type === ScenarioConditionType.DevicePowerOff) {
            return (await devicesClient.getDeviceInfo(params.deviceId)).state.power === false;
          }

          return true;
        }),
      )
    )[conditionsOperator === LogicalOperator.And ? 'every' : 'some'](Boolean);
  }

  async deleteScenario(scenarioId: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const scenario = await tx.scenario.findUnique({
        where: {
          id: scenarioId,
        },
      });

      if (!scenario) {
        return;
      }

      const scenarioSteps = await tx.scenarioStep.findMany({
        where: {
          type: ScenarioStepType.RunScenario,
          payload: {
            path: ['scenarioId'],
            equals: scenarioId,
          },
        },
      });

      for (const scenarioStep of scenarioSteps) {
        await this.deleteScenarioStep(scenarioStep.id, tx);
      }

      await tx.scenario.delete({
        where: {
          id: scenarioId,
        },
      });
    });
  }

  async deleteScenarioCondition(scenarioConditionId: number, tx?: PrismaTransaction): Promise<void> {
    await runInTransaction(tx, async () => {
      await prisma.scenarioCondition.delete({
        where: {
          id: scenarioConditionId,
        },
      });
    });
  }

  async deleteScenarioRelatedDeviceData(deviceId: number, tx: PrismaTransaction): Promise<void> {
    const findConditionParams = {
      where: {
        type: {
          in: [
            ScenarioConditionType.DeviceOnline,
            ScenarioConditionType.DeviceOffline,
            ScenarioConditionType.DevicePowerOn,
            ScenarioConditionType.DevicePowerOff,
          ],
        },
        payload: {
          path: ['deviceId'],
          equals: deviceId,
        },
      },
    };

    const [steps, triggers, scenarioConditions, scenarioStepConditions] = await Promise.all([
      tx.scenarioStep.findMany({
        where: {
          type: {
            in: [ScenarioStepType.TurnOnDevice, ScenarioStepType.TurnOffDevice, ScenarioStepType.ToggleDevice],
          },
          payload: {
            path: ['deviceId'],
            equals: deviceId,
          },
        },
      }),
      tx.scenarioTrigger.findMany({
        where: {
          type: {
            in: [
              ScenarioTriggerType.DeviceOnline,
              ScenarioTriggerType.DeviceOffline,
              ScenarioTriggerType.DevicePowerOn,
              ScenarioTriggerType.DevicePowerOff,
            ],
          },
          payload: {
            path: ['deviceId'],
            equals: deviceId,
          },
        },
      }),
      tx.scenarioCondition.findMany(findConditionParams),
      tx.scenarioStepCondition.findMany(findConditionParams),
    ]);

    for (const step of steps) {
      await this.deleteScenarioStep(step.id, tx);
    }

    await Promise.all([
      ...triggers.map(({ id }) => this.deleteScenarioTrigger(id, tx)),
      ...scenarioConditions.map(({ id }) => this.deleteScenarioCondition(id, tx)),
      ...scenarioStepConditions.map(({ id }) => this.deleteScenarioStepCondition(id, tx)),
    ]);
  }

  async deleteScenarioStep(scenarioStepId: number, tx?: PrismaTransaction): Promise<void> {
    await runInTransaction(tx, async (tx) => {
      const scenarioStep = await tx.scenarioStep.findUnique({
        where: {
          id: scenarioStepId,
        },
      });

      if (!scenarioStep) {
        return;
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

  async deleteScenarioStepCondition(scenarioStepConditionId: number, tx?: PrismaTransaction): Promise<void> {
    await runInTransaction(tx, async () => {
      await prisma.scenarioStepCondition.delete({
        where: {
          id: scenarioStepConditionId,
        },
      });
    });
  }

  async deleteScenarioTrigger(triggerId: number, tx?: PrismaTransaction): Promise<void> {
    await runInTransaction(tx, async (tx) => {
      const trigger = await tx.scenarioTrigger.findUnique({
        where: {
          id: triggerId,
        },
      });

      if (!trigger) {
        return;
      }

      await tx.scenarioTrigger.delete({
        where: {
          id: triggerId,
        },
      });

      this.unregisterTrigger(trigger);
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

  async editScenarioTrigger(scenarioTriggerId: number, data: Partial<ScenarioTrigger>): Promise<void> {
    const oldTrigger = await this.getScenarioTrigger(scenarioTriggerId);
    const newTrigger = await prisma.scenarioTrigger.update({
      where: {
        id: scenarioTriggerId,
      },
      data: {
        ...data,
        payload: data.payload ?? undefined,
      },
    });

    if (isEqual(getTriggerParams(oldTrigger), getTriggerParams(newTrigger))) {
      return;
    }

    this.unregisterTrigger(oldTrigger);
    this.registerTrigger(newTrigger);
  }

  async findScenario(query: string): Promise<Scenario> {
    const scenario = await prisma.scenario.findFirst({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
    });

    if (!scenario) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Сценарий не найден');
    }

    return scenario;
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

  async getScenarioTrigger(triggerId: number): Promise<ScenarioTrigger> {
    const trigger = await prisma.scenarioTrigger.findUnique({
      where: {
        id: triggerId,
      },
    });

    if (!trigger) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Триггер не найден');
    }

    return trigger;
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

  async isTriggerNameAllowed(scenarioId: number, name: string): Promise<boolean> {
    return !(await prisma.scenarioTrigger.findFirst({
      where: {
        scenarioId,
        name,
      },
    }));
  }

  registerTrigger(trigger: ScenarioTrigger): void {
    const triggerParams = getTriggerParams(trigger);

    if (!triggerParams || this._registeredTriggers.has(trigger.id)) {
      return;
    }

    const callback = (): void => {
      runTask(async () => {
        await this.runScenario(trigger.scenarioId);
      });
    };
    let registeredTrigger: RegisteredTrigger | null = null;

    if (triggerParams.type === ScenarioTriggerType.Schedule) {
      const cronJob = scheduler.addJob({
        schedule: triggerParams.schedule,
        callback,
      });

      registeredTrigger = {
        unregister: () => {
          cronJob.stop();
        },
      };
    } else if (triggerParams.type === ScenarioTriggerType.EmptyHome) {
      registeredTrigger = {
        unregister: devicesClient.listen('emptyHome', callback),
      };
    } else if (triggerParams.type === ScenarioTriggerType.NonEmptyHome) {
      registeredTrigger = {
        unregister: devicesClient.listen('nonEmptyHome', callback),
      };
    } else if (triggerParams.type === ScenarioTriggerType.DeviceOnline) {
      registeredTrigger = {
        unregister: devicesClient.listen('deviceOnline', (device: Device) => {
          if (device.id !== triggerParams.deviceId) {
            return;
          }

          callback();
        }),
      };
    } else if (triggerParams.type === ScenarioTriggerType.DeviceOffline) {
      registeredTrigger = {
        unregister: devicesClient.listen('deviceOffline', (device: Device) => {
          if (device.id !== triggerParams.deviceId) {
            return;
          }

          callback();
        }),
      };
    } else if (triggerParams.type === ScenarioTriggerType.DevicePowerOn) {
      // TODO: add support for power on
    } else if (triggerParams.type === ScenarioTriggerType.DevicePowerOff) {
      // TODO: add support for power off
    } else if (triggerParams.type === ScenarioTriggerType.TelegramCommand) {
      // TODO: add support for telegram command
    }

    // TODO: add support for all triggers

    if (registeredTrigger) {
      this._registeredTriggers.set(trigger.id, registeredTrigger);
    }
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

    if (!(await this.areConditionsMet(scenario.conditions, scenario.conditionsOperator))) {
      throw new CustomError(ErrorCode.CONDITIONS_NOT_MET, 'Условия не выполнены');
    }

    for (const step of scenario.steps) {
      await this.runScenarioStep(step);
    }
  }

  async runScenarioStep(step: ScenarioStep & { conditions: ScenarioStepCondition[] }): Promise<void> {
    if (!step.isActive || !(await this.areConditionsMet(step.conditions, step.conditionsOperator))) {
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
    } else if (runParams.type === ScenarioStepType.ToggleDevice) {
      await devicesClient.toggleDevicePower(runParams.deviceId);
    }
  }

  unregisterTrigger(trigger: ScenarioTrigger): void {
    this._registeredTriggers.get(trigger.id)?.unregister();
    this._registeredTriggers.delete(trigger.id);
  }
}
