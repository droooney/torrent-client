import { BotCommand } from 'node-telegram-bot-api';

export enum CommandType {
  START = '/start',
  ADD_TORRENT = '/addtorrent',
  STATUS = '/status',
  LIST = '/list',
  PAUSE = '/pause',
  UNPAUSE = '/unpause',
  SET_DOWNLOAD_LIMIT = '/setdownloadlimit',
  SET_UPLOAD_LIMIT = '/setuploadlimit',
}

interface CustomBotCommand extends BotCommand {
  command: CommandType;
}

const commands: CustomBotCommand[] = [
  {
    command: CommandType.ADD_TORRENT,
    description: 'Добавить торрент',
  },
  {
    command: CommandType.STATUS,
    description: 'Получить текущий статус',
  },
  {
    command: CommandType.LIST,
    description: 'Получить список всех торрентов',
  },
  {
    command: CommandType.PAUSE,
    description: 'Поставить на паузу',
  },
  {
    command: CommandType.UNPAUSE,
    description: 'Убрать с паузы',
  },
  {
    command: CommandType.SET_DOWNLOAD_LIMIT,
    description: 'Ограничить скорость загрузки',
  },
  {
    command: CommandType.SET_UPLOAD_LIMIT,
    description: 'Ограничить скорость отдачи',
  },
];

export default commands;
