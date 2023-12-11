export function minmax(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function formatProgress(value: number, emojiCount: number = 10): string {
  const finishedEmoji = '🟩';
  const notFinishedEmoji = '⬜️';
  let progressString = '';

  for (let i = 0; i < emojiCount; i++) {
    progressString += (i + 1) / emojiCount <= value ? finishedEmoji : notFinishedEmoji;
  }

  return progressString;
}

export function formatIndex(index: number): string {
  return ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].at(index) ?? String(index + 1);
}
