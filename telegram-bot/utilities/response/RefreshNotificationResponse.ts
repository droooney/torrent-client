import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';
import NotificationResponse from 'telegram-bot/utilities/response/NotificationResponse';

export default class RefreshNotificationResponse extends NotificationResponse {
  constructor(updateResponse: ImmediateTextResponse) {
    super({
      text: 'Данные обновлены',
      updateMessage: updateResponse,
    });
  }
}
