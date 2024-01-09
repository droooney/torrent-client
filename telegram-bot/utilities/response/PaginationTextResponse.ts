import chunk from 'lodash/chunk';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import { Message } from 'node-telegram-bot-api';

import { BeautifiedCallbackData, InlineKeyboard, InlineKeyboardButton } from 'telegram-bot/types/keyboard';
import { MaybePromise } from 'types/common';

import Markdown from 'telegram-bot/utilities/Markdown';
import { callbackButton } from 'telegram-bot/utilities/keyboard';
import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';
import TextResponse, { EditMessageContext, SendMessageContext } from 'telegram-bot/utilities/response/TextResponse';
import { formatIndex } from 'utilities/number';

export interface PaginationTextResponseOptions<Item> {
  page?: number;
  pageSize?: number;
  itemsPerRow?: number;
  emptyPageText?: string | Markdown;
  getPageItemsInfo(options: GetPageItemsOptions): MaybePromise<PageItemsInfo<Item>>;
  getPageButtonCallbackData(page: number): BeautifiedCallbackData;
  getItemButton(item: Item, indexIcon: string): InlineKeyboardButton;
  getItemText(item: Item, indexString: string): MaybePromise<string | Markdown>;
  getKeyboard(paginationButtons: InlineKeyboardButton[][]): MaybePromise<InlineKeyboard>;
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

export default class PaginationTextResponse<Item> extends TextResponse {
  private readonly page: number;
  private readonly pageSize: number;
  private readonly itemsPerRow: number;
  private readonly emptyPageText: string | Markdown;
  private readonly getPageItemsInfo: PaginationTextResponseOptions<Item>['getPageItemsInfo'];
  private readonly getPageButtonCallbackData: PaginationTextResponseOptions<Item>['getPageButtonCallbackData'];
  private readonly getItemButton: PaginationTextResponseOptions<Item>['getItemButton'];
  private readonly getItemText: PaginationTextResponseOptions<Item>['getItemText'];
  private readonly getKeyboard: PaginationTextResponseOptions<Item>['getKeyboard'];

  constructor(options: PaginationTextResponseOptions<Item>) {
    super();

    this.page = options.page ?? 0;
    this.pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    this.itemsPerRow = options.itemsPerRow ?? DEFAULT_ITEMS_PER_ROW;
    this.emptyPageText = options.emptyPageText ?? DEFAULT_EMPTY_PAGE_TEXT;
    this.getPageItemsInfo = options.getPageItemsInfo;
    this.getPageButtonCallbackData = options.getPageButtonCallbackData;
    this.getKeyboard = options.getKeyboard;
    this.getItemButton = options.getItemButton;
    this.getItemText = options.getItemText;
  }

  async editMessage(ctx: EditMessageContext): Promise<Message> {
    return (await this.generateImmediateResponse()).editMessage(ctx);
  }

  async generateImmediateResponse(): Promise<ImmediateTextResponse> {
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

    const text =
      allPagesCount < 2
        ? ''
        : Markdown.create`📄 ${Markdown.bold('Страница')}: ${page + 1} из ${allPagesCount}
🔢 ${Markdown.bold('Показаны результаты')}: ${start + 1}-${Math.min(end, allCount)} из ${allCount}`;
    const itemsText = Markdown.join(
      await Promise.all(items.map((item, index) => this.getItemText(item, formatIndex(index)))),
      '\n\n\n',
    );

    return new ImmediateTextResponse({
      text: itemsText.isEmpty()
        ? Markdown.join([text, this.emptyPageText], '\n\n')
        : Markdown.join([text, itemsText], '\n\n\n'),
      keyboard: await this.getKeyboard([
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

  async sendMessage(ctx: SendMessageContext): Promise<Message> {
    return (await this.generateImmediateResponse()).sendMessage(ctx);
  }
}
