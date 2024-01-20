const CHARACTERS_TO_ESCAPE = /[_*[\]()~`>#+\-=|{}.!\\]/g;

export type MarkdownAllowedEntity = string | number | false | null | undefined | Markdown;

export type MarkdownNotEmptyAllowedEntity = Exclude<MarkdownAllowedEntity, false | null | undefined | ''>;

class Markdown {
  static bold(value: MarkdownNotEmptyAllowedEntity): Markdown {
    return new Markdown(`*${Markdown.stringifyForMarkdown(value)}*`);
  }

  private static compile(strings: TemplateStringsArray, ...entities: MarkdownAllowedEntity[]): string {
    return entities.reduce<string>(
      (text, entity, index) => {
        const entityString = Markdown.isNotEmptyAllowedEntity(entity)
          ? entity instanceof Markdown
            ? entity.toString()
            : Markdown.escape(String(entity))
          : '';

        return `${text}${entityString}${Markdown.escape(strings.at(index + 1) ?? '')}`;
      },
      Markdown.escape(strings.at(0) ?? ''),
    );
  }

  static create(strings: TemplateStringsArray, ...entities: MarkdownAllowedEntity[]): Markdown {
    return new Markdown(Markdown.compile(strings, ...entities));
  }

  static escape(value: string): string {
    return value.replace(CHARACTERS_TO_ESCAPE, '\\$&');
  }

  static fixedWidth(value: string): Markdown {
    return new Markdown(`\`${Markdown.stringifyForMarkdown(value)}\``);
  }

  static isNotEmptyAllowedEntity(entity: MarkdownAllowedEntity): entity is MarkdownNotEmptyAllowedEntity {
    return entity !== false && entity != null && entity !== '';
  }

  static italic(value: MarkdownNotEmptyAllowedEntity): Markdown {
    return new Markdown(`_${Markdown.stringifyForMarkdown(value)}_`);
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

  static stringifyForMarkdown(value: MarkdownNotEmptyAllowedEntity): string {
    return value instanceof Markdown ? value.toString() : Markdown.escape(String(value));
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
