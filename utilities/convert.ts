export function booleanToNumber(value: boolean): 0 | 1 {
  return value ? 1 : 0;
}

export function numberToBoolean(value: 0 | 1): boolean {
  return Boolean(value);
}
