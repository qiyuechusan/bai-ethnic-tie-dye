/**
 * 确定性随机：同一个种子每次生成同样纹样，便于分享和导出。
 */
export function hashString(value) {
  let hash = 2166136261 >>> 0;
  const text = String(value ?? '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let state = typeof seed === 'number' ? seed >>> 0 : hashString(seed);
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomBetween(random, min, max) {
  return min + (max - min) * random();
}

export function pick(random, items) {
  return items[Math.floor(random() * items.length) % items.length];
}

export function createSeed() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seed = '';
  for (let i = 0; i < 4; i += 1) {
    seed += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return seed;
}
