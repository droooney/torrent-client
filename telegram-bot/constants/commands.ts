import { BotCommand } from 'node-telegram-bot-api';

export enum CommandType {
  START = '/start',
  ADD_TORRENT = '/addtorrent',
  PAUSE = '/pause',
  UNPAUSE = '/unpause',
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
    command: CommandType.PAUSE,
    description: 'Поставить на паузу',
  },
  {
    command: CommandType.UNPAUSE,
    description: 'Убрать с паузы',
  },
];

export default commands;
