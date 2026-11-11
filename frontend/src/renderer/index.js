import { drawCloth } from './cloth.js';
import { colorAt, mixHex } from './color.js';
import { createSeed, mulberry32 } from './random.js';
import { drawSpiral } from './patterns/spiral.js';
import { drawStitch } from './patterns/stitch.js';
import { drawAccordion } from './patterns/accordion.js';
import { drawBean } from './patterns/bean.js';
import { drawMotif } from './patterns/motif.js';
import {
  DEFAULT_OXIDATION,
  easeValue,
  normalizeOxidation,
  resolveFinalColor,
} from './oxidation.js';

const PATTERNS = {
  spiral: drawSpiral,
  stitch: drawStitch,
  accordion: drawAccordion,
  bean: drawBean,
  motif: drawMotif,
};

// 黄绿 → 青绿 → 靛蓝，默认值仍与旧版一致；AI 模式可被后端参数覆盖。
const DEFAULT_COLOR = DEFAULT_OXIDATION.finalColor;

export function createDiyRenderer(canvas, options = {}) {
  let width = options.width || 900;
  let height = options.height || 1125;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.aspectRatio = `${width} / ${height}`;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  let clothCanvas;
  let maskCanvas;
  let tintCanvas;
  let clothCtx;
  let maskCtx;
  let tintCtx;

  const reducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  let method = null;
  let seed = options.seed || createSeed();
  let oxidation = normalizeOxidation(options.oxidation);
  let animationId = 0;
  let destroyed = false;
  let lastRender = { color: DEFAULT_COLOR, tintAlpha: 0.24 };

  function createLayer(layerWidth, layerHeight) {
    const layer = document.createElement('canvas');
    layer.width = layerWidth;
    layer.height = layerHeight;
    return layer;
  }

  function initLayers() {
    clothCanvas = createLayer(width, height);
    maskCanvas = createLayer(width, height);
    tintCanvas = createLayer(width, height);
    clothCtx = clothCanvas.getContext('2d');
    maskCtx = maskCanvas.getContext('2d');
    tintCtx = tintCanvas.getContext('2d');
  }

  function params() {
    return method?.params || {};
  }

  function rebuild() {
    if (destroyed) return;
    const pattern = PATTERNS[method?.patternType] || drawSpiral;
    const random = mulberry32(`${seed}:${method?.code || 'spiral'}`);

    drawCloth(clothCtx, width, height, mulberry32(`${seed}:cloth`));

    maskCtx.save();
    maskCtx.setTransform(1, 0, 0, 1, 0, 0);
    maskCtx.clearRect(0, 0, width, height);
    pattern(maskCtx, width, height, params(), random);
    maskCtx.restore();

    drawFrame({ color: '#8fa9a7', reveal: 1, sheen: 0, tintAlpha: 0.24 });
  }

  function paintTint(color) {
    tintCtx.save();
    tintCtx.setTransform(1, 0, 0, 1, 0, 0);
    tintCtx.globalCompositeOperation = 'source-over';
    tintCtx.clearRect(0, 0, width, height);
    tintCtx.fillStyle = color;
    tintCtx.fillRect(0, 0, width, height);
    tintCtx.globalCompositeOperation = 'destination-in';
    tintCtx.drawImage(maskCanvas, 0, 0);
    tintCtx.restore();
  }

  function drawFrame({ color = DEFAULT_COLOR, reveal = 1, sheen = 0, tintAlpha = 0.9 } = {}) {
    if (destroyed) return;
    lastRender = { color, tintAlpha };

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(clothCanvas, 0, 0, width, height);

    paintTint(color);

    ctx.save();
    if (reveal < 1) {
      ctx.beginPath();
      ctx.rect(0, height * (1 - reveal), width, height * reveal);
      ctx.clip();
    }
    ctx.globalAlpha = tintAlpha;
    ctx.drawImage(tintCanvas, 0, 0, width, height);
    ctx.restore();

    // 浸染边界的水光
    if (reveal > 0 && reveal < 1) {
      const edgeY = height * (1 - reveal);
      const edge = ctx.createLinearGradient(0, edgeY - 16, 0, edgeY + 18);
      edge.addColorStop(0, 'rgba(255, 255, 255, 0)');
      edge.addColorStop(0.5, 'rgba(210, 238, 230, 0.36)');
      edge.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = edge;
      ctx.fillRect(0, edgeY - 16, width, 34);
    }

    // 氧化过程中沿布面移动的湿润高光
    if (sheen > 0.001) {
      const shine = ctx.createLinearGradient(0, 0, width, height);
      shine.addColorStop(0, 'rgba(255, 255, 255, 0)');
      shine.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
      shine.addColorStop(0.49, `rgba(255, 255, 255, ${0.24 * sheen})`);
      shine.addColorStop(0.55, `rgba(235, 250, 246, ${0.14 * sheen})`);
      shine.addColorStop(0.66, 'rgba(255, 255, 255, 0)');
      shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = shine;
      ctx.fillRect(0, 0, width, height);
    }

    drawVignette(ctx);

    ctx.restore();
  }

  function drawVignette(targetContext) {
    const vignette = targetContext.createRadialGradient(
      width * 0.5, height * 0.44, Math.min(width, height) * 0.16,
      width * 0.5, height * 0.5, Math.hypot(width, height) * 0.64,
    );
    vignette.addColorStop(0, 'rgba(6, 29, 53, 0)');
    vignette.addColorStop(0.72, 'rgba(6, 29, 53, 0.03)');
    vignette.addColorStop(1, 'rgba(6, 29, 53, 0.18)');
    targetContext.save();
    targetContext.fillStyle = vignette;
    targetContext.fillRect(0, 0, width, height);
    targetContext.restore();
  }

  function setMethod(nextMethod) {
    if (!nextMethod) return;
    method = nextMethod;
    rebuild();
  }

  function setSeed(nextSeed) {
    const value = String(nextSeed || '').trim();
    seed = value || createSeed();
    rebuild();
    return seed;
  }

  function getSeed() {
    return seed;
  }

  function getMethod() {
    return method;
  }

  function setOxidationConfig(config) {
    oxidation = normalizeOxidation(config);
    return oxidation;
  }

  function getOxidationConfig() {
    return { ...oxidation, stops: [...oxidation.stops] };
  }

  function resize(nextWidth, nextHeight) {
    width = Math.max(600, Math.min(1600, Math.round(Number(nextWidth) || width)));
    height = Math.max(600, Math.min(1600, Math.round(Number(nextHeight) || height)));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.aspectRatio = `${width} / ${height}`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initLayers();
    rebuild();
  }

  function dye({ dips = 1, onProgress } = {}) {
    cancelAnimationFrame(animationId);
    if (!method) {
      rebuild();
    }

    const config = normalizeOxidation(oxidation);
    const dipCount = Math.max(1, Math.min(4, Number(dips) || 1));
    const finalColor = resolveFinalColor(config, dipCount);
    const dipColor = config.stops[0] || DEFAULT_OXIDATION.stops[0];

    if (reducedMotion) {
      drawFrame({ color: finalColor, reveal: 1, sheen: 0, tintAlpha: config.tintAlpha });
      onProgress?.({ phase: 'done', progress: 1, color: finalColor });
      return Promise.resolve(finalColor);
    }

    const dipDuration = config.dipDurationMs;
    const oxidationDuration = config.oxidationDurationMs;
    const start = performance.now();

    return new Promise((resolve) => {
      function tick(now) {
        if (destroyed) {
          resolve(finalColor);
          return;
        }

        const elapsed = now - start;
        if (elapsed < dipDuration) {
          const progress = elapsed / dipDuration;
          const eased = 1 - Math.pow(1 - progress, 2);
          drawFrame({
            color: dipColor,
            reveal: eased,
            sheen: 0.35 * (1 - eased),
            tintAlpha: config.tintAlpha,
          });
          onProgress?.({ phase: 'dip', progress, color: dipColor });
          animationId = requestAnimationFrame(tick);
          return;
        }

        const progress = Math.min(1, (elapsed - dipDuration) / oxidationDuration);
        const eased = easeValue(config.easing, progress);
        const color = colorAt(config.stops, eased);
        const sheen = Math.sin(Math.PI * Math.min(1, progress + 0.08)) * (1 - progress * 0.55) * 0.8;
        drawFrame({ color, reveal: 1, sheen, tintAlpha: config.tintAlpha });
        onProgress?.({ phase: 'oxidation', progress, color });

        if (progress < 1) {
          animationId = requestAnimationFrame(tick);
        } else {
          drawFrame({ color: finalColor, reveal: 1, sheen: 0, tintAlpha: config.tintAlpha });
          onProgress?.({ phase: 'done', progress: 1, color: finalColor });
          resolve(finalColor);
        }
      }

      animationId = requestAnimationFrame(tick);
    });
  }

  async function exportPng(filename = `蓝白之境-${seed}.png`) {
    if (!method) {
      rebuild();
    }

    // 导出时按 1600px 宽重新合成，避免直接放大小画布导致模糊
    const exportWidth = 1600;
    const scale = exportWidth / width;
    const exportHeight = Math.round(height * scale);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const exportCtx = exportCanvas.getContext('2d');

    exportCtx.drawImage(clothCanvas, 0, 0, exportWidth, exportHeight);
    paintTint(lastRender.color);
    exportCtx.globalAlpha = lastRender.tintAlpha;
    exportCtx.drawImage(tintCanvas, 0, 0, exportWidth, exportHeight);
    exportCtx.globalAlpha = 1;

    const vignette = exportCtx.createRadialGradient(
      exportWidth * 0.5, exportHeight * 0.44, Math.min(exportWidth, exportHeight) * 0.16,
      exportWidth * 0.5, exportHeight * 0.5, Math.hypot(exportWidth, exportHeight) * 0.64,
    );
    vignette.addColorStop(0, 'rgba(6, 29, 53, 0)');
    vignette.addColorStop(0.72, 'rgba(6, 29, 53, 0.03)');
    vignette.addColorStop(1, 'rgba(6, 29, 53, 0.18)');
    exportCtx.fillStyle = vignette;
    exportCtx.fillRect(0, 0, exportWidth, exportHeight);

    return new Promise((resolve, reject) => {
      exportCanvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('导出图片失败'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
        resolve();
      }, 'image/png');
    });
  }

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(animationId);
  }

  initLayers();

  // 没有 method 时先给一个默认螺旋，避免画布空白
  if (options.method) {
    method = options.method;
  } else {
    method = { code: 'spiral', patternType: 'spiral', params: {} };
  }
  rebuild();

  return {
    setMethod,
    setSeed,
    getSeed,
    getMethod,
    setOxidationConfig,
    getOxidationConfig,
    resize,
    dye,
    exportPng,
    destroy,
  };
}
