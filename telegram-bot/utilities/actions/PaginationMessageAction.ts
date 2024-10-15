import { InlineKeyboard, InlineKeyboardButton, Markdown } from '@tg-sensei/bot';
import chunk from 'lodash/chunk';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';

import {
  Action,
  ActionOnCallbackQueryContext,
  ActionOnMessageContext,
  MessageAction,
} from 'telegram-bot/types/actions';
import { CallbackData } from 'telegram-bot/types/keyboard';
import { MaybePromise } from 'types/common';

import { callbackButton } from 'telegram-bot/utilities/keyboard';
import { formatIndex } from 'utilities/number';

export interface PaginationMessageActionOptions<Item> {
  page?: number;
  pageSize?: number;
  itemsPerRow?: number;
  emptyPageText?: string | Markdown;
  getPageText?: (pageText: Markdown) => string | Markdown;
  getPageItemsInfo: (options: GetPageItemsOptions) => MaybePromise<PageItemsInfo<Item>>;
  getPageButtonCallbackData: (page: number) => CallbackData;
  getItemButton: (item: Item, indexIcon: string) => InlineKeyboardButton<CallbackData>;
  getItemText: (item: Item, indexString: string) => MaybePromise<string | Markdown>;
  getKeyboard: (
    paginationButtons: InlineKeyboardButton<CallbackData>[][],
  ) => MaybePromise<InlineKeyboard<CallbackData>>;
}

export interface PageItemsInfo<Item> {
  items: Item[];
  allCount: number;
}

export interface GetPageItemsOptions {
  skip: number;
  take: number;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_ITEMS_PER_ROW = 2;
const DEFAULT_EMPTY_PAGE_TEXT = 'Страница пуста';

export default class PaginationMessageAction<Item> implements Action {
  private readonly page: number;
  private readonly pageSize: number;
  private readonly itemsPerRow: number;
  private readonly emptyPageText: string | Markdown;
  private readonly getPageText: PaginationMessageActionOptions<Item>['getPageText'];
  private readonly getPageItemsInfo: PaginationMessageActionOptions<Item>['getPageItemsInfo'];
  private readonly getPageButtonCallbackData: PaginationMessageActionOptions<Item>['getPageButtonCallbackData'];
  private readonly getItemButton: PaginationMessageActionOptions<Item>['getItemButton'];
  private readonly getItemText: PaginationMessageActionOptions<Item>['getItemText'];
  private readonly getKeyboard: PaginationMessageActionOptions<Item>['getKeyboard'];

  constructor(options: PaginationMessageActionOptions<Item>) {
    this.page = options.page ?? 0;
    this.pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    this.itemsPerRow = options.itemsPerRow ?? DEFAULT_ITEMS_PER_ROW;
    this.emptyPageText = options.emptyPageText ?? DEFAULT_EMPTY_PAGE_TEXT;
    this.getPageText = options.getPageText;
    this.getPageItemsInfo = options.getPageItemsInfo;
    this.getPageButtonCallbackData = options.getPageButtonCallbackData;
    this.getKeyboard = options.getKeyboard;
    this.getItemButton = options.getItemButton;
    this.getItemText = options.getItemText;
  }

  private async generateMessageAction(): Promise<MessageAction> {
    const { page, pageSize } = this;

    const start = page * pageSize;
    const end = start + pageSize;

    const { items, allCount } = await this.getPageItemsInfo({
      skip: start,
      take: pageSize,
    });

    const allPagesCount = Math.ceil(allCount / pageSize);

    const allowedPages: number[] = [];

    if (start > 0) {
      allowedPages.push(0, page - 1);
    }

    if (end < allCount) {
      allowedPages.push(page + 1, allPagesCount - 1);
    }

    const headerText =
      allPagesCount < 2
        ? ''
        : Markdown.create`📄 ${Markdown.bold('Страница')}: ${page + 1} из ${allPagesCount}
🔢 ${Markdown.bold('Показаны результаты')}: ${start + 1}-${Math.min(end, allCount)} из ${allCount}`;
    const itemsText = Markdown.join(
      await Promise.all(items.map((item, index) => this.getItemText(item, formatIndex(index)))),
      '\n\n\n',
    );
    const pageText = itemsText.isEmpty()
      ? Markdown.join([headerText, this.emptyPageText], '\n\n')
      : Markdown.join([headerText, itemsText], '\n\n\n');
    const text = this.getPageText?.(pageText) ?? pageText;

    return new MessageAction({
      content: {
        type: 'text',
        text,
      },
      replyMarkup: await this.getKeyboard([
        ...chunk(
          items.map((item, index) => this.getItemButton(item, formatIndex(index))),
          this.itemsPerRow,
        ),
        uniq(sortBy(allowedPages)).map((p) =>
          callbackButton(
            p === page - 1 ? '◀️' : p === page + 1 ? '▶️' : p === 0 ? '⏪' : '⏩',
            `Стр. ${p + 1}`,
            this.getPageButtonCallbackData(p),
          ),
        ),
      ]),
    });
  }

  async onCallbackQuery(ctx: ActionOnCallbackQueryContext): Promise<void> {
    await (await this.generateMessageAction()).onCallbackQuery(ctx);
  }

  async onMessage(ctx: ActionOnMessageContext): Promise<void> {
    await (await this.generateMessageAction()).onMessage(ctx);
  }
}
