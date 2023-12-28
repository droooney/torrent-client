export function isDefined<T>(value: T): value is Exclude<T, null | undefined> {
  return value != null;
}

export function isTruthy<T>(value: T): value is Exclude<T, null | undefined | false | 0 | ''> {
  return Boolean(value);
}
