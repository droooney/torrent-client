import { CronJob } from 'cron';

export type AddJobOptions = {
  schedule: string;
  callback: () => void | Promise<void>;
};

export default class Scheduler {
  addJob(options: AddJobOptions): void {
    CronJob.from({
      cronTime: options.schedule,
      start: true,
      onTick: options.callback,
    });
  }
}
