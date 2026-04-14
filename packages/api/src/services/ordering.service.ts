/**
 * Simple fractional indexing for drag-and-drop ordering.
 * Generates a string key between two existing keys.
 * Keys are lowercase alpha strings that sort lexicographically.
 */

const CHARS = 'abcdefghijklmnopqrstuvwxyz';
const MID = 13; // index of 'n' - midpoint

export function generateKeyBetween(a: string | null, b: string | null): string {
  if (a === null && b === null) return midKey();
  if (a === null) return keyBefore(b!);
  if (b === null) return keyAfter(a);
  return keyBetween(a, b);
}

function midKey(): string {
  return CHARS[MID]; // 'n'
}

function keyBefore(b: string): string {
  // Find a key that sorts before b
  for (let i = 0; i < b.length; i++) {
    const idx = CHARS.indexOf(b[i]);
    if (idx > 1) {
      return b.slice(0, i) + CHARS[Math.floor(idx / 2)];
    }
    if (idx > 0) {
      // carry and go deeper
      return b.slice(0, i) + CHARS[0] + CHARS[MID];
    }
  }
  return b + CHARS[MID];
}

function keyAfter(a: string): string {
  // Find a key that sorts after a
  for (let i = a.length - 1; i >= 0; i--) {
    const idx = CHARS.indexOf(a[i]);
    if (idx < CHARS.length - 1) {
      return a.slice(0, i) + CHARS[idx + 1];
    }
  }
  return a + CHARS[MID];
}

function keyBetween(a: string, b: string): string {
  // Pad to same length
  const maxLen = Math.max(a.length, b.length);
  const aP = a.padEnd(maxLen, CHARS[0]);
  const bP = b.padEnd(maxLen, CHARS[0]);

  for (let i = 0; i < maxLen; i++) {
    const aIdx = CHARS.indexOf(aP[i]);
    const bIdx = CHARS.indexOf(bP[i]);

    if (aIdx < bIdx - 1) {
      return aP.slice(0, i) + CHARS[Math.floor((aIdx + bIdx) / 2)];
    }

    if (aIdx < bIdx) {
      // Adjacent characters - go one level deeper
      return aP.slice(0, i + 1) + midKey();
    }
  }

  // If we get here, strings are equal or a > b, append midpoint
  return a + CHARS[MID];
}

/**
 * Generate N evenly-spaced keys for an initial list.
 */
export function generateNKeys(n: number): string[] {
  const keys: string[] = [];
  let prev: string | null = null;
  for (let i = 0; i < n; i++) {
    const next = generateKeyBetween(prev, null);
    keys.push(next);
    prev = next;
  }
  return keys;
}
