const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/**
 * Converts a jsonwebtoken-style duration ("15m", "7d", "3600") to milliseconds.
 * Falls back to the provided default when the value is unparsable.
 */
export function durationToMs(value: string, fallback: string): number {
  for (const input of [value, fallback]) {
    const match = /^(\d+)\s*([smhdw])?$/i.exec(String(input).trim());
    if (!match) continue;
    const amount = Number(match[1]);
    const unit = (match[2] ?? 's').toLowerCase();
    const factor = UNIT_MS[unit];
    if (factor && amount > 0) return amount * factor;
  }
  return 7 * 86_400_000;
}
