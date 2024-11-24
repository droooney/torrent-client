import { Markdown, MessageResponse } from '@tg-sensei/bot';
import systemClient from 'system-client/client';

import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';
import { SystemCallbackButtonType } from 'telegram-bot/types/keyboard/system';

import { backCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import { formatDuration } from 'utilities/date';
import { formatPercent } from 'utilities/number';
import { formatSize } from 'utilities/size';
import { formatTemperature } from 'utilities/temperature';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(SystemCallbackButtonType.OpenStatus, async (ctx) => {
  const { withSystemRestartConfirm, withProcessRestartConfirm } = ctx.callbackData;

  await ctx.respondWith(
    await getStatusResponse({
      withSystemRestartConfirm,
      withProcessRestartConfirm,
    }),
  );
});

callbackDataProvider.handle(SystemCallbackButtonType.RestartProcess, async (ctx) => {
  systemClient.scheduleProcessShutdown();

  await ctx.respondWith(
    new MessageResponse({
      content: 'Дом будет перезагружен через 5 секунд',
    }),
  );
});

callbackDataProvider.handle(SystemCallbackButtonType.RestartSystem, async (ctx) => {
  await systemClient.scheduleSystemReboot();

  await ctx.respondWith(
    new MessageResponse({
      content: 'Система будет перезагружена через одну минуту',
    }),
  );
});

type GetStatusResponseOptions = {
  withSystemRestartConfirm?: boolean;
  withProcessRestartConfirm?: boolean;
};

async function getStatusResponse(options: GetStatusResponseOptions = {}): Promise<MessageResponse> {
  const { withSystemRestartConfirm = false, withProcessRestartConfirm = false } = options;

  const [cpuUsage] = await Promise.all([systemClient.getCpuUsage()]);

  const osTotalMemory = systemClient.getOsTotalMemory();
  const osUsedMemory = osTotalMemory - systemClient.getOsFreeMemory();

  const text = Markdown.create`💻 ${Markdown.underline(Markdown.bold('[Система]'))}
🧮 ${Markdown.bold('Использование CPU')}: ${formatPercent(cpuUsage.os)}
🛠 ${Markdown.bold('Использование RAM')}: ${formatSize(osUsedMemory)} (${formatPercent(osUsedMemory / osTotalMemory)})
🕖 ${Markdown.bold('Время работы')}: ${formatDuration(systemClient.getOsUptime())}`;

  if (!systemClient.isWsl()) {
    const cpuTemperature = await systemClient.getCpuTemperature();

    text.add`
🌡 ${Markdown.bold('Температура CPU')}: ${formatTemperature(cpuTemperature)}`;
  }

  text.add`


🤖 ${Markdown.underline(Markdown.bold('[Дом]'))}
🧮 ${Markdown.bold('Использование CPU')}: ${formatPercent(cpuUsage.process)}
🛠 ${Markdown.bold('Использование RAM')}: ${formatSize(systemClient.getProcessUsedMemory())}
🕖 ${Markdown.bold('Время работы')}: ${formatDuration(systemClient.getProcessUptime())}`;

  return new MessageResponse({
    content: text,
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      [
        refreshCallbackButton({
          type: SystemCallbackButtonType.OpenStatus,
          isRefresh: true,
        }),
      ],
      [
        callbackButton(
          '🛑',
          withProcessRestartConfirm ? 'Точно перезагрузить дом?' : 'Перезагрузить дом',
          withProcessRestartConfirm
            ? {
                type: SystemCallbackButtonType.RestartProcess,
              }
            : {
                type: SystemCallbackButtonType.OpenStatus,
                withProcessRestartConfirm: true,
              },
        ),
      ],
      [
        callbackButton(
          '🛑',
          withSystemRestartConfirm ? 'Точно перезагрузить систему?' : 'Перезагрузить систему',
          withSystemRestartConfirm
            ? {
                type: SystemCallbackButtonType.RestartSystem,
              }
            : {
                type: SystemCallbackButtonType.OpenStatus,
                withSystemRestartConfirm: true,
              },
        ),
      ],
      [
        backCallbackButton({
          type: RootCallbackButtonType.OpenRoot,
        }),
      ],
    ]),
  });
}
