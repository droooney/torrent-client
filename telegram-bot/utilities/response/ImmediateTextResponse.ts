/* eslint-disable camelcase */

import isEqual from 'lodash/isEqual';
import { InlineKeyboardMarkup, Message, ParseMode } from 'node-telegram-bot-api';

import { InlineKeyboard } from 'telegram-bot/types/keyboard';

import Markdown from 'telegram-bot/utilities/Markdown';
import { prepareInlineKeyboard } from 'telegram-bot/utilities/keyboard';
import TextResponse, { EditMessageContext, SendMessageContext } from 'telegram-bot/utilities/response/TextResponse';
import CustomError, { ErrorCode } from 'utilities/CustomError';

export interface ResponseOptions {
  text: string | Markdown;
  keyboard?: InlineKeyboard;
}

class ImmediateTextResponse extends TextResponse {
  readonly text: string | Markdown;
  readonly keyboard?: InlineKeyboard;

  constructor(options: ResponseOptions) {
    super();

    this.text = options.text;
    this.keyboard = options.keyboard;
  }

  async editMessage(ctx: EditMessageContext): Promise<Message> {
    const newText = this.text.toString();
    const newReplyMarkup = this.getReplyMarkup();
    let editedMessage: Message | null = null;

    if (newText !== ctx.message.text || !isEqual(ctx.message.reply_markup, newReplyMarkup)) {
      try {
        const editResult = await ctx.api.editMessageText(this.text.toString(), {
          chat_id: ctx.message.chat.id,
          message_id: ctx.message.message_id,
          parse_mode: this.getParseMode(),
          reply_markup: newReplyMarkup,
        });

        if (typeof editResult === 'object') {
          editedMessage = editResult;
        }
      } catch (err) {
        if (!(err instanceof Error) || !/message is not modified/.test(err.message)) {
          throw err;
        }
      }
    }

    if (!editedMessage) {
      throw new CustomError(ErrorCode.SAME_CONTENT, 'Сообщение не обновлено');
    }

    return editedMessage;
  }

  private getParseMode(): ParseMode | undefined {
    return this.text instanceof Markdown ? 'MarkdownV2' : undefined;
  }

  private getReplyMarkup(): InlineKeyboardMarkup | undefined {
    return this.keyboard && prepareInlineKeyboard(this.keyboard);
  }

  async sendMessage(ctx: SendMessageContext): Promise<Message> {
    return ctx.api.sendMessage(ctx.chatId, this.text.toString(), {
      reply_to_message_id: ctx.replyToMessageId,
      parse_mode: this.getParseMode(),
      reply_markup: this.getReplyMarkup(),
    });
  }
}

export default ImmediateTextResponse;
