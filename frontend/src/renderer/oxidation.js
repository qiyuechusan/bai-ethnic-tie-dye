import { mixHex } from './color.js';

export const DEFAULT_OXIDATION = Object.freeze({
  stops: Object.freeze(['#c9d27c', '#7e9a70', '#2d6d8e', '#0b3863']),
  finalColor: '#0b3863',
  dipDurationMs: 620,
  oxidationDurationMs: 2400,
  tintAlpha: 0.92,
  dips: 1,
  easing: 'easeOutCubic',
});

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function normalizeOxidation(config = {}) {
  const stops = Array.isArray(config.stops)
    ? config.stops.filter((color) => HEX_PATTERN.test(String(color || ''))).slice(0, 5)
    : [];
  return {
    stops: stops.length >= 2 ? stops : [...DEFAULT_OXIDATION.stops],
    finalColor: HEX_PATTERN.test(String(config.finalColor || ''))
      ? config.finalColor
      : DEFAULT_OXIDATION.finalColor,
    dipDurationMs: clampNumber(config.dipDurationMs, 350, 1200, DEFAULT_OXIDATION.dipDurationMs),
    oxidationDurationMs: clampNumber(
      config.oxidationDurationMs,
      1200,
      5000,
      DEFAULT_OXIDATION.oxidationDurationMs,
    ),
    tintAlpha: clampNumber(config.tintAlpha, 0.6, 1, DEFAULT_OXIDATION.tintAlpha),
    dips: clampNumber(config.dips, 1, 4, DEFAULT_OXIDATION.dips),
    easing: config.easing || DEFAULT_OXIDATION.easing,
  };
}

/**
 * 后端给的是基准色；用户增减浸染次数时做温和的深浅补偿。
 */
export function resolveFinalColor(config, dips) {
  const normalized = normalizeOxidation(config);
  const baseDips = normalized.dips;
  const actualDips = Math.max(1, Math.min(4, Number(dips) || baseDips));
  const delta = actualDips - baseDips;
  if (delta === 0) {
    return normalized.finalColor;
  }
  if (delta > 0) {
    return mixHex(normalized.finalColor, '#061d35', Math.min(0.6, delta * 0.18));
  }
  return mixHex(normalized.finalColor, '#8fb0aa', Math.min(0.6, -delta * 0.22));
}

export function easeValue(name, value) {
  const t = Math.max(0, Math.min(1, Number(value) || 0));
  switch (name) {
    case 'linear':
      return t;
    case 'easeOutQuad':
      return 1 - (1 - t) * (1 - t);
    case 'easeInOutCubic':
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case 'easeOutCubic':
    default:
      return 1 - Math.pow(1 - t, 3);
  }
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, number));
}
