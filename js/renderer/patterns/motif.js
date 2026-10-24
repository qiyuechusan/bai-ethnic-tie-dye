/**
 * 通用纹样渲染器：把后端生成的 motifType / symmetry / scale 等参数
 * 转成 Canvas 防染遮罩。沿用现有 renderer 的约定：
 * 先铺白色可染区，再用 destination-out 擦出被扎住、不上色的部分。
 */

const MOTIF_TYPES = new Set([
  'butterfly', 'fish', 'lotus', 'plum', 'sun', 'octagon',
  'wave', 'coin', 'fret', 'ice', 'geometric',
]);

export function drawMotif(ctx, width, height, params = {}, random = Math.random) {
  const motifType = MOTIF_TYPES.has(params.motifType) ? params.motifType : 'wave';
  const scale = clamp(Number(params.scale) || 0.3, 0.08, 0.6);
  const repeat = Math.round(clamp(Number(params.repeat) || 4, 1, 12));
  const spacing = clamp(Number(params.spacing) || 0.18, 0, 0.5);
  const rotation = ((Number(params.rotation) || 0) * Math.PI) / 180;
  const gap = clamp(Number(params.lineGap) || 8, 2, 20) * (width / 900);
  const partialRatio = clamp(Number(params.partialRatio) || 0, 0, 1);
  const jitter = clamp(Number(params.jitter) || 0, 0, 0.15);
  const centerX = width * clamp(Number(params.centerX) || 0.5, 0, 1);
  const centerY = height * clamp(Number(params.centerY) || 0.46, 0, 1);
  const alpha = 0.55 + 0.45 * (1 - partialRatio);

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;

  const size = Math.min(width, height) * scale;
  switch (motifType) {
    case 'butterfly':
      drawButterfly(ctx, centerX, centerY, size, gap, rotation, jitter, random);
      break;
    case 'fish':
      drawFish(ctx, centerX, centerY, size, gap, rotation, jitter, random);
      break;
    case 'lotus':
      drawFlower(ctx, centerX, centerY, size, 8, gap, rotation, jitter, random);
      break;
    case 'plum':
      drawFlower(ctx, centerX, centerY, size, 5, gap, rotation, jitter, random);
      break;
    case 'octagon':
      drawFlower(ctx, centerX, centerY, size, 8, gap, rotation, jitter, random);
      break;
    case 'sun':
      drawSun(ctx, centerX, centerY, size, gap, rotation, jitter, random);
      break;
    case 'coin':
      drawCoin(ctx, centerX, centerY, size, gap, rotation, repeat);
      break;
    case 'wave':
      drawWave(ctx, width, height, repeat, gap, jitter, random, rotation);
      break;
    case 'fret':
      drawFret(ctx, width, height, repeat, gap, spacing, alpha);
      break;
    case 'ice':
      drawIce(ctx, width, height, repeat, gap, jitter, random);
      break;
    case 'geometric':
      drawGeometric(ctx, width, height, repeat, gap, spacing, alpha);
      break;
    default:
      drawWave(ctx, width, height, repeat, gap, jitter, random, rotation);
  }

  ctx.restore();
}

function drawButterfly(ctx, cx, cy, size, gap, rotation, jitter, random) {
  const s = size * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.lineWidth = gap;

  // 右侧上翅与下翅，左侧镜像
  [-1, 1].forEach((direction) => {
    const j = (random() - 0.5) * jitter * s;
    ctx.beginPath();
    ctx.moveTo(direction * gap * 0.4, -gap * 0.6);
    ctx.bezierCurveTo(
      direction * s * (0.36 + jitter), -s * (1.0 + j),
      direction * s * (1.02 + j), -s * 0.52,
      direction * s * 0.42, gap * 0.2,
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(direction * gap * 0.4, gap * 0.6);
    ctx.bezierCurveTo(
      direction * s * (0.7 + j), s * (0.42 + jitter),
      direction * s * 0.62, s * (0.96 + j),
      direction * s * 0.24, s * 0.36,
    );
    ctx.stroke();

    // 翅脉
    ctx.beginPath();
    ctx.moveTo(direction * gap * 0.5, 0);
    ctx.lineTo(direction * s * 0.62, -s * 0.4);
    ctx.stroke();
  });

  // 身体与触须
  ctx.beginPath();
  ctx.ellipse(0, 0, gap * 0.8, s * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  [-1, 1].forEach((direction) => {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.42);
    ctx.quadraticCurveTo(direction * s * 0.18, -s * 0.66, direction * s * 0.3, -s * 0.82);
    ctx.stroke();
  });
  ctx.restore();
}

function drawFish(ctx, cx, cy, size, gap, rotation, jitter, random) {
  const s = size * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.lineWidth = gap;

  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-s * 0.86, 0);
  ctx.lineTo(-s * 1.22, -s * 0.32);
  ctx.quadraticCurveTo(-s * 1.02, 0, -s * 1.22, s * 0.32);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-s * 0.1, -s * 0.38);
  ctx.quadraticCurveTo(s * 0.16, -s * (0.76 + jitter), s * 0.42, -s * 0.32);
  ctx.stroke();

  // 鱼鳞：几道弧线
  for (let i = 0; i < 4; i += 1) {
    const x = -s * 0.45 + i * s * 0.28 + (random() - 0.5) * jitter * s;
    ctx.beginPath();
    ctx.arc(x, 0, s * 0.16, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(s * 0.58, -s * 0.08, gap * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlower(ctx, cx, cy, size, petals, gap, rotation, jitter, random) {
  const radius = size * 0.5;
  const count = Math.max(3, Math.min(12, petals));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.lineWidth = gap;

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const petalLength = radius * (0.82 + (random() - 0.5) * jitter * 2);
    const petalWidth = radius * 0.34;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(angle - 0.55) * petalLength * 0.5,
      Math.sin(angle - 0.55) * petalLength * 0.5,
      Math.cos(angle) * petalLength,
      Math.sin(angle) * petalLength,
    );
    ctx.quadraticCurveTo(
      Math.cos(angle + 0.55) * petalLength * 0.5,
      Math.sin(angle + 0.55) * petalLength * 0.5,
      0,
      0,
    );
    ctx.stroke();

    // 花瓣内侧再压一道，形成双层防染轮廓
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * petalWidth, Math.sin(angle) * petalWidth);
    ctx.lineTo(Math.cos(angle) * petalLength * 0.72, Math.sin(angle) * petalLength * 0.72);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, gap * 1.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSun(ctx, cx, cy, size, gap, rotation, jitter, random) {
  const radius = size * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.lineWidth = gap;

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.26, 0, Math.PI * 2);
  ctx.stroke();
  const rays = 12;
  for (let i = 0; i < rays; i += 1) {
    const angle = (i / rays) * Math.PI * 2;
    const inner = radius * (0.36 + random() * jitter);
    const outer = radius * (0.72 + random() * 0.22);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCoin(ctx, cx, cy, size, gap, rotation, repeat) {
  const radius = size * 0.5;
  const rings = Math.max(1, Math.min(4, repeat));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.lineWidth = gap;

  for (let i = 1; i <= rings; i += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * (i / rings) * 0.9, 0, Math.PI * 2);
    ctx.stroke();
  }
  const hole = radius * 0.22;
  ctx.beginPath();
  ctx.rect(-hole, -hole, hole * 2, hole * 2);
  ctx.stroke();
  ctx.restore();
}

function drawWave(ctx, width, height, repeat, gap, jitter, random, rotation) {
  const bands = Math.max(2, repeat);
  const amplitude = Math.min(width, height) * (0.05 + jitter * 0.2);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(rotation);
  ctx.translate(-width / 2, -height / 2);
  ctx.lineWidth = gap;

  for (let band = 0; band < bands; band += 1) {
    const baseY = ((band + 1) / (bands + 1)) * height;
    const phase = random() * Math.PI * 2;
    const wavelength = width * (0.18 + random() * 0.12);
    for (let line = 0; line < 2; line += 1) {
      ctx.beginPath();
      for (let x = -20; x <= width + 20; x += 8) {
        const y = baseY
          + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amplitude
          + line * gap * 1.4
          + (random() - 0.5) * jitter * width * 0.02;
        if (x === -20) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFret(ctx, width, height, repeat, gap, spacing, alpha) {
  const rows = Math.max(2, repeat);
  const cell = Math.min(width, height) / (rows + 1);
  ctx.save();
  ctx.lineWidth = gap;
  ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
  for (let row = 0; row < rows; row += 1) {
    const y = height * ((row + 1) / (rows + 1));
    const offset = (row % 2) * cell * 0.5;
    for (let x = offset; x < width; x += cell * (1 + spacing)) {
      ctx.beginPath();
      ctx.moveTo(x, y - cell * 0.3);
      ctx.lineTo(x + cell * 0.6, y - cell * 0.3);
      ctx.lineTo(x + cell * 0.6, y + cell * 0.3);
      ctx.lineTo(x + cell * 0.18, y + cell * 0.3);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawIce(ctx, width, height, repeat, gap, jitter, random) {
  const cracks = Math.max(4, repeat * 3);
  ctx.save();
  ctx.lineWidth = Math.max(1.5, gap * 0.7);
  for (let i = 0; i < cracks; i += 1) {
    let x = random() * width;
    let y = random() * height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const steps = 4 + Math.floor(random() * 5);
    for (let step = 0; step < steps; step += 1) {
      x += (random() - 0.5) * width * (0.12 + jitter);
      y += (random() - 0.5) * height * (0.12 + jitter);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawGeometric(ctx, width, height, repeat, gap, spacing, alpha) {
  const columns = Math.max(2, repeat);
  const rows = Math.max(2, Math.round(repeat * 0.7));
  const cellWidth = width / (columns + 1);
  const cellHeight = height / (rows + 1);
  const size = Math.min(cellWidth, cellHeight) * (0.42 + spacing);
  ctx.save();
  ctx.lineWidth = gap;
  ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cx = (column + 1) * cellWidth;
      const cy = (row + 1) * cellHeight;
      ctx.beginPath();
      ctx.rect(cx - size / 2, cy - size / 2, size, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - size / 2, cy);
      ctx.lineTo(cx + size / 2, cy);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
