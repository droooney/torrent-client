import MarkdownEntity from 'telegram-bot/utilities/MarkdownEntity';

const CHARACTERS_TO_ESCAPE = /[_*[\]()~`>#+\-=|{}.!\\]/g;

export type AllowedEntity = string | number | false | null | undefined | MarkdownEntity | Markdown;

class Markdown {
  static bold(value: string): MarkdownEntity {
    return new MarkdownEntity(`*${Markdown.escape(value)}*`);
  }

  private static compile(strings: TemplateStringsArray, ...entities: AllowedEntity[]): string {
    return entities.reduce<string>((text, entity, index) => {
      const entityString =
        entity === false || entity == null
          ? ''
          : entity instanceof MarkdownEntity || entity instanceof Markdown
            ? entity.toString()
            : Markdown.escape(String(entity));

      return `${text}${entityString}${Markdown.escape(strings[index + 1])}`;
    }, Markdown.escape(strings[0]));
  }

  static create(strings: TemplateStringsArray, ...entities: AllowedEntity[]): Markdown {
    return new Markdown(Markdown.compile(strings, ...entities));
  }

  static escape(value: string): string {
    return value.replace(CHARACTERS_TO_ESCAPE, '\\$&');
  }

  static join(markdowns: Markdown[], joiner: AllowedEntity): Markdown {
    const markdown = new Markdown();

    markdowns.forEach((text, index) => {
      markdown.add`${text}`;

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

  add(strings: TemplateStringsArray, ...entities: AllowedEntity[]): void {
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
