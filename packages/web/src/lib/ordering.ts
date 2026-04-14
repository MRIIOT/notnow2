/**
 * Fractional indexing for drag-and-drop ordering.
 * Generates a string key between two existing keys.
 * Mirror of packages/api/src/services/ordering.service.ts
 */

const CHARS = 'abcdefghijklmnopqrstuvwxyz';
const MID = 13;

export function generateKeyBetween(a: string | null, b: string | null): string {
  if (a === null && b === null) return CHARS[MID];
  if (a === null) return keyBefore(b!);
  if (b === null) return keyAfter(a);
  return keyBetween(a, b);
}

function keyBefore(b: string): string {
  for (let i = 0; i < b.length; i++) {
    const idx = CHARS.indexOf(b[i]);
    if (idx > 1) return b.slice(0, i) + CHARS[Math.floor(idx / 2)];
    if (idx > 0) return b.slice(0, i) + CHARS[0] + CHARS[MID];
  }
  return b + CHARS[MID];
}

function keyAfter(a: string): string {
  for (let i = a.length - 1; i >= 0; i--) {
    const idx = CHARS.indexOf(a[i]);
    if (idx < CHARS.length - 1) return a.slice(0, i) + CHARS[idx + 1];
  }
  return a + CHARS[MID];
}

function keyBetween(a: string, b: string): string {
  const maxLen = Math.max(a.length, b.length);
  const aP = a.padEnd(maxLen, CHARS[0]);
  const bP = b.padEnd(maxLen, CHARS[0]);

  for (let i = 0; i < maxLen; i++) {
    const aIdx = CHARS.indexOf(aP[i]);
    const bIdx = CHARS.indexOf(bP[i]);
    if (aIdx < bIdx - 1) return aP.slice(0, i) + CHARS[Math.floor((aIdx + bIdx) / 2)];
    if (aIdx < bIdx) return aP.slice(0, i + 1) + CHARS[MID];
  }
  return a + CHARS[MID];
}
