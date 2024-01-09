import MarkdownEntity from 'telegram-bot/utilities/MarkdownEntity';

const CHARACTERS_TO_ESCAPE = /[_*[\]()~`>#+\-=|{}.!\\]/g;

export type MarkdownAllowedEntity = string | number | false | null | undefined | MarkdownEntity | Markdown;

export type MarkdownNotEmptyAllowedEntity = Exclude<MarkdownAllowedEntity, false | null | undefined | ''>;

class Markdown {
  static bold(value: string): MarkdownEntity {
    return new MarkdownEntity(`*${Markdown.escape(value)}*`);
  }

  private static compile(strings: TemplateStringsArray, ...entities: MarkdownAllowedEntity[]): string {
    return entities.reduce<string>((text, entity, index) => {
      const entityString = Markdown.isNotEmptyAllowedEntity(entity)
        ? entity instanceof MarkdownEntity || entity instanceof Markdown
          ? entity.toString()
          : Markdown.escape(String(entity))
        : '';

      return `${text}${entityString}${Markdown.escape(strings[index + 1])}`;
    }, Markdown.escape(strings[0]));
  }

  static create(strings: TemplateStringsArray, ...entities: MarkdownAllowedEntity[]): Markdown {
    return new Markdown(Markdown.compile(strings, ...entities));
  }

  static escape(value: string): string {
    return value.replace(CHARACTERS_TO_ESCAPE, '\\$&');
  }

  static isNotEmptyAllowedEntity(entity: MarkdownAllowedEntity): entity is MarkdownNotEmptyAllowedEntity {
    return entity !== false && entity != null && entity !== '';
  }

  static join(markdowns: MarkdownAllowedEntity[], joiner: MarkdownNotEmptyAllowedEntity): Markdown {
    const markdown = new Markdown();

    markdowns.filter(Markdown.isNotEmptyAllowedEntity).forEach((entity, index) => {
      markdown.add`${entity}`;

      if (index < markdowns.length - 1) {
        markdown.add`${joiner}`;
      }
    });

    return markdown;
  }

  private value: string;

  constructor(value: string = '') {
    this.value = value;
  }

  add(strings: TemplateStringsArray, ...entities: MarkdownAllowedEntity[]): void {
    this.value += Markdown.compile(strings, ...entities);
  }

  isEmpty(): boolean {
    return this.value.trim() === '';
  }

  toString(): string {
    return this.value;
  }
}

export default Markdown;
