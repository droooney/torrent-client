/* eslint-disable camelcase */

import isEqual from 'lodash/isEqual';
import { InlineKeyboardMarkup, Message, ParseMode } from 'node-telegram-bot-api';

import { InlineKeyboard } from 'telegram-bot/types/keyboard';

import { ResponseEditContext, ResponseSendContext } from 'telegram-bot/utilities/Bot';
import Markdown from 'telegram-bot/utilities/Markdown';
import { prepareInlineKeyboard } from 'telegram-bot/utilities/keyboard';
import CustomError, { ErrorCode } from 'utilities/CustomError';

export interface ResponseOptions {
  text: string | Markdown;
  keyboard?: InlineKeyboard;
}

class Response {
  readonly text: string | Markdown;
  readonly keyboard?: InlineKeyboard;

  constructor(options: ResponseOptions) {
    this.text = options.text;
    this.keyboard = options.keyboard;
  }

  async edit(ctx: ResponseEditContext): Promise<void> {
    const newText = this.text.toString();
    const newReplyMarkup = this.getReplyMarkup();
    let isEdited = false;

    if (newText !== ctx.message.text || !isEqual(ctx.message.reply_markup, newReplyMarkup)) {
      try {
        await ctx.api.editMessageText(this.text.toString(), {
          chat_id: ctx.message.chat.id,
          message_id: ctx.message.message_id,
          parse_mode: this.getParseMode(),
          reply_markup: newReplyMarkup,
        });

        isEdited = true;
      } catch (err) {
        if (!(err instanceof Error) || !/message is not modified/.test(err.message)) {
          throw err;
        }
      }
    }

    if (!isEdited) {
      throw new CustomError(ErrorCode.SAME_CONTENT, 'Сообщение не обновлено');
    }
  }

  private getParseMode(): ParseMode | undefined {
    return this.text instanceof Markdown ? 'MarkdownV2' : undefined;
  }

  private getReplyMarkup(): InlineKeyboardMarkup | undefined {
    return this.keyboard && prepareInlineKeyboard(this.keyboard);
  }

  async send(ctx: ResponseSendContext): Promise<Message> {
    return ctx.api.sendMessage(ctx.message.chat.id, this.text.toString(), {
      reply_to_message_id: ctx.message.message_id,
      parse_mode: this.getParseMode(),
      reply_markup: this.getReplyMarkup(),
    });
  }
}

export default Response;
