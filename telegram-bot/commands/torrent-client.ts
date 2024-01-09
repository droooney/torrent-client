import { TelegramUserState } from '@prisma/client';

import { CommandType } from 'telegram-bot/constants/commands';

import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';

import bot from 'telegram-bot/bot';

// bot.handleCommand(CommandType.STATUS, async (ctx) => {
//   await ctx.updateUserState({
//     state: TelegramUserState.Waiting,
//   });
//
//   return getStatusResponse();
// });
//
// bot.handleCommand(CommandType.LIST, async (ctx) => {
//   await ctx.updateUserState({
//     state: TelegramUserState.Waiting,
//   });
//
//   return getTelegramTorrentsListResponse();
// });
//
// bot.handleCommand(CommandType.PAUSE, async (ctx) => {
//   await ctx.updateUserState({
//     state: TelegramUserState.Waiting,
//   });
//
//   await torrentClient.pause();
//
//   return new Response({
//     text: 'Клиент поставлен на паузу',
//   });
// });
//
// bot.handleCommand(CommandType.UNPAUSE, async (ctx) => {
//   await ctx.updateUserState({
//     state: TelegramUserState.Waiting,
//   });
//
//   await torrentClient.unpause();
//
//   return new Response({
//     text: 'Клиент снят с паузы',
//   });
// });
//
// bot.handleCommand(CommandType.SEARCH_RUTRACKER, async (ctx) => {
//   await ctx.updateUserState({
//     state: TelegramUserState.SearchRutracker,
//   });
//
//   return new ImmediateTextResponse({
//     text: 'Введите название для поиска на rutracker',
//   });
// });
//
// bot.handleCommand(CommandType.ADD_TORRENT, async (ctx) => {
//   await ctx.updateUserState({
//     state: TelegramUserState.AddTorrent,
//   });
//
//   return new Response({
//     text: 'Отправьте торрент или magnet-ссылку',
//   });
// });
//
// bot.handleCommand(CommandType.SET_DOWNLOAD_LIMIT, async (ctx) => {
//   await ctx.updateUserState({
//     state: TelegramUserState.SetDownloadLimit,
//   });
//
//   const { downloadSpeedLimit } = await torrentClient.getState();
//
//   return new Response({
//     text: `Отправьте строку вида "10мб", чтобы ограничить скорость загрузки${
//       downloadSpeedLimit ? `. Отправьте "-", чтобы снять текущее ограничение (${formatSpeed(downloadSpeedLimit)})` : ''
//     }`,
//   });
// });
//
// bot.handleCommand(CommandType.SET_UPLOAD_LIMIT, async (ctx) => {
//   await ctx.updateUserState({
//     state: TelegramUserState.SetUploadLimit,
//   });
//
//   const { uploadSpeedLimit } = await torrentClient.getState();
//
//   return new Response({
//     text: `Отправьте строку вида "10мб", чтобы ограничить скорость выгрузки${
//       uploadSpeedLimit ? `. Отправьте "-", чтобы снять текущее ограничение (${formatSpeed(uploadSpeedLimit)})` : ''
//     }`,
//   });
// });
