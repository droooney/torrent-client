export function minmax(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export type ProgressShape = 'square' | 'circle';

export type ProgressColor = 'red' | 'orange' | 'yellow' | 'green' | 'white';

export interface FormatProgressOptions {
  emojiCount?: number;
  shape?: ProgressShape;
  finishedColor?: ProgressColor;
  notFinishedColor?: ProgressColor;
}

const SHAPE_INFO: Record<ProgressShape, Record<ProgressColor, string>> = {
  square: {
    red: '🟥',
    orange: '🟧',
    yellow: '🟨',
    green: '🟩',
    white: '⬜️',
  },
  circle: {
    red: '🔴',
    orange: '🟠',
    yellow: '🟡',
    green: '🟢',
    white: '⚪️',
  },
};

export function formatProgress(value: number, options: FormatProgressOptions = {}): string {
  const { emojiCount = 10, shape = 'square', finishedColor = 'green', notFinishedColor = 'white' } = options;

  const finishedEmoji = SHAPE_INFO[shape][finishedColor];
  const notFinishedEmoji = SHAPE_INFO[shape][notFinishedColor];
  let progressString = '';

  for (let i = 0; i < emojiCount; i++) {
    progressString += (i + 1) / emojiCount <= value ? finishedEmoji : notFinishedEmoji;
  }

  return progressString;
}

export function formatIndex(index: number): string {
  return ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].at(index) ?? `[${String(index + 1)}]`;
}

export function bigintMax(...values: bigint[]): bigint {
  return values.reduce((max, value) => (value > max ? value : max));
}

export function bigintMin(...values: bigint[]): bigint {
  return values.reduce((max, value) => (value < max ? value : max));
}
