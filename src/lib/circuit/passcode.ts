const WORDS = [
  "BELL",
  "ROPE",
  "BOOT",
  "HOLD",
  "LOCK",
  "CARD",
  "AISLE",
  "CHAIR",
  "RING",
  "MAT",
  "ROAR",
  "HEEL",
  "FACE",
  "COUNT",
  "BELT",
  "CLINCH",
  "SWEEP",
  "GREEN",
  "HOOK",
  "TURN",
  "LANE",
  "GATE",
  "POST",
  "RAIL",
  "CROWD",
  "LIGHT",
  "FLOOR",
  "PIN",
  "BOOK",
  "TICKET",
] as const;

export function normalizePasscode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isNicePasscode(code: string) {
  return /^[A-Z]{3,6}-\d{2}$/.test(normalizePasscode(code));
}

export function mintPasscode(used: Iterable<string>) {
  const taken = new Set([...used].map(normalizePasscode));
  for (let i = 0; i < 800; i += 1) {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const n = String(10 + Math.floor(Math.random() * 90));
    const code = `${word}-${n}`;
    if (!taken.has(code)) return code;
  }
  return `PIN-${String(10 + Math.floor(Math.random() * 90))}${taken.size}`;
}
