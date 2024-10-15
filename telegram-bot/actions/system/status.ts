import { Markdown } from '@tg-sensei/bot';
import systemClient from 'system-client/client';

import { MessageAction } from 'telegram-bot/types/actions';
import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';
import { SystemCallbackButtonType } from 'telegram-bot/types/keyboard/system';

import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { backCallbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import { formatDuration } from 'utilities/date';
import { formatPercent } from 'utilities/number';
import { formatSize } from 'utilities/size';
import { formatTemperature } from 'utilities/temperature';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(SystemCallbackButtonType.OpenStatus, async ({ data }) => {
  const action = await getStatusAction();

  return data.isRefresh ? new RefreshDataAction(action) : action;
});

async function getStatusAction(): Promise<MessageAction> {
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


🤖 ${Markdown.underline(Markdown.bold('[Процесс]'))}
🧮 ${Markdown.bold('Использование CPU')}: ${formatPercent(cpuUsage.process)}
🛠 ${Markdown.bold('Использование RAM')}: ${formatSize(systemClient.getProcessUsedMemory())}
🕖 ${Markdown.bold('Время работы')}: ${formatDuration(systemClient.getProcessUptime())}`;

  return new MessageAction({
    content: {
      type: 'text',
      text,
    },
    replyMarkup: [
      [
        refreshCallbackButton({
          type: SystemCallbackButtonType.OpenStatus,
          isRefresh: true,
        }),
      ],
      [
        backCallbackButton({
          type: RootCallbackButtonType.OpenRoot,
        }),
      ],
    ],
  });
}
