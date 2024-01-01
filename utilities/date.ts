import { DAY, HOUR, MINUTE, SECOND, WEEK } from 'constants/date';

interface Duration {
  value: number;
  suffix: string;
}

const DURATIONS: Duration[] = [
  {
    value: SECOND,
    suffix: 'сек',
  },
  {
    value: MINUTE,
    suffix: 'мин',
  },
  {
    value: HOUR,
    suffix: 'ч',
  },
  {
    value: DAY,
    suffix: 'дн',
  },
  {
    value: WEEK,
    suffix: 'нед',
  },
];

const PERIODS_SHOWN_COUNT = 2;

export function formatDuration(ms: number): string {
  let maxPeriodIndex = DURATIONS.findIndex(({ value }) => ms < value);

  if (maxPeriodIndex === -1) {
    maxPeriodIndex = DURATIONS.length;
  }

  maxPeriodIndex = Math.max(1, maxPeriodIndex);

  let left = ms;

  return DURATIONS.slice(Math.max(0, maxPeriodIndex - PERIODS_SHOWN_COUNT), maxPeriodIndex)
    .reverse()
    .map(({ value, suffix }) => {
      const times = Math.floor(left / value);

      left = Math.max(0, left - times * value);

      return `${times} ${suffix}`;
    })
    .join(' ');
}
