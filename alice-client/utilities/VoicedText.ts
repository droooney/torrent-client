export type VoicedTextAllowedEntity = string | number | false | null | undefined | VoicedText;

export type VoicedTextNotEmptyAllowedEntity = Exclude<VoicedTextAllowedEntity, false | null | undefined | ''>;

export interface CompiledVoicedText {
  text: string;
  tts: string;
}

export default class VoicedText {
  private text: string;
  private tts: string;

  static create(strings: TemplateStringsArray, ...entities: VoicedTextAllowedEntity[]): VoicedText {
    return entities.reduce<VoicedText>(
      (compiled, entity, index) => {
        const entityValue = VoicedText.isNotEmptyAllowedEntity(entity)
          ? entity instanceof VoicedText
            ? entity
            : new VoicedText(String(entity))
          : '';

        if (entityValue) {
          compiled.add(entityValue);
        }

        compiled.add(new VoicedText(strings.at(index + 1) ?? ''));

        return compiled;
      },
      new VoicedText(strings.at(0) ?? ''),
    );
  }

  static isNotEmptyAllowedEntity(entity: VoicedTextAllowedEntity): entity is VoicedTextNotEmptyAllowedEntity {
    return entity !== false && entity != null && entity !== '';
  }

  static textTts(text: string, tts: string): VoicedText {
    return new VoicedText(text, tts);
  }

  constructor(text: string = '', tts: string = text) {
    this.text = text;
    this.tts = tts;
  }

  add(stringsOrText: VoicedText): void;
  add(stringsOrText: TemplateStringsArray, ...entities: VoicedTextAllowedEntity[]): void;
  add(stringsOrText: TemplateStringsArray | VoicedText, ...entities: VoicedTextAllowedEntity[]): void {
    if (stringsOrText instanceof VoicedText) {
      this.text += stringsOrText.text;
      this.tts += stringsOrText.tts;
    } else {
      this.add(VoicedText.create(stringsOrText, ...entities));
    }
  }

  toCompiled(): CompiledVoicedText {
    return {
      text: this.text,
      tts: this.tts,
    };
  }
}
