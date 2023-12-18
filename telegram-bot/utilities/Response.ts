/* eslint-disable camelcase */

import isEqual from 'lodash/isEqual';
import { InlineKeyboardMarkup, Message, ParseMode } from 'node-telegram-bot-api';

import { InlineKeyboard } from 'telegram-bot/types/keyboard';

import { ResponseEditContext, ResponseSendContext } from 'telegram-bot/utilities/Bot';
import Markdown from 'telegram-bot/utilities/Markdown';
import { prepareInlineKeyboard } from 'telegram-bot/utilities/serialize';

export interface ResponseOptions {
  text: string | Markdown;
  keyboard?: InlineKeyboard;
}

class Response {
  private readonly text: string | Markdown;
  private readonly keyboard?: InlineKeyboard;

  constructor(options: ResponseOptions) {
    this.text = options.text;
    this.keyboard = options.keyboard;
  }

  async edit(ctx: ResponseEditContext): Promise<void> {
    const newText = this.text.toString();
    const newReplyMarkup = this.getReplyMarkup();

    if (newText !== ctx.message.text || !isEqual(ctx.message.reply_markup, newReplyMarkup)) {
      await ctx.api.editMessageText(this.text.toString(), {
        chat_id: ctx.message.chat.id,
        message_id: ctx.message.message_id,
        parse_mode: this.getParseMode(),
        reply_markup: newReplyMarkup,
      });
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
