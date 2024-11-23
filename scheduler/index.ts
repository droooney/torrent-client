import scheduler from 'scheduler/scheduler';

import { DAY } from 'constants/date';

import prisma from 'db/prisma';

scheduler.addJob({
  schedule: '0 0 */1 * * *',
  callback: async () => {
    await prisma.telegramCallbackData.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 30 * DAY),
        },
      },
    });
  },
});
