export function formatTemperature(degrees: number, fractionDigits = 1): string {
  return `${degrees.toFixed(fractionDigits)}°C`;
}
