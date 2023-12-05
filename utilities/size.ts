import some from 'lodash/some';

const SUFFIXES: { en: string; ru: string }[] = [
  {
    en: 'B',
    ru: 'Б',
  },
  {
    en: 'KB',
    ru: 'КБ',
  },
  {
    en: 'MB',
    ru: 'МБ',
  },
  {
    en: 'GB',
    ru: 'ГБ',
  },
  {
    en: 'TB',
    ru: 'ТБ',
  },
];

export function formatSize(bytes: number, fractionDigits = 1): string {
  const index = bytes === 0 ? 0 : Math.floor(Math.log10(bytes) / 3);
  const actualIndex = index in SUFFIXES ? index : SUFFIXES.length - 1;
  const suffix = SUFFIXES[actualIndex].ru;
  const size = bytes / 10 ** (actualIndex * 3);

  return `${actualIndex === 0 ? size : size.toFixed(fractionDigits)}\u00a0${suffix}`;
}

export function parseSize(size: string): number | null {
  size = size.trim();

  const match = size.match(/^(\d+) *([a-zа-я]+)$/i);

  if (!match) {
    return null;
  }

  const value = Number(match[1]);

  if (Number.isNaN(value)) {
    return null;
  }

  const suffixString = match[2].toUpperCase();
  const suffixIndex = SUFFIXES.findIndex((languages) => some(languages, (suffix) => suffix === suffixString));

  if (suffixIndex === -1) {
    return null;
  }

  return value * 10 ** (suffixIndex * 3);
}
