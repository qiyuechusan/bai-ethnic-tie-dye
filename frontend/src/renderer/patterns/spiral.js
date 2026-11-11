/**
 * 螺旋绞缬：从中心向外一圈圈扎紧，展开后得到放射状螺旋。
 * mask 默认整块可染（白色），再用 destination-out 擦出被扎住、未上色的部分。
 */
export function drawSpiral(ctx, width, height, params = {}, random = Math.random) {
  const rings = Math.max(6, Math.min(28, Number(params.rings) || 14));
  const gap = Math.max(2, Number(params.gap) || 9) * (width / 900);
  const wobble = Math.max(0, Number(params.wobble) || 0.06);
  const core = Math.max(10, width * (Number(params.core) || 0.05));
  const spokes = Math.max(0, Math.min(16, Number(params.spokes) || 6));
  const centerX = width * 0.5;
  const centerY = height * 0.46;
  const maxRadius = Math.hypot(width, height) * 0.46;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let ring = 0; ring < rings; ring += 1) {
    const progress = (ring + 1) / rings;
    const radius = core + Math.pow(progress, 1.08) * (maxRadius - core);
    const points = 96;
    const phase = random() * Math.PI * 2;
    const ringWobble = wobble * radius;

    ctx.beginPath();
    for (let point = 0; point <= points; point += 1) {
      const angle = (point / points) * Math.PI * 2;
      const jitter = Math.sin(angle * 3 + ring * 0.6 + phase) * ringWobble
        + (random() - 0.5) * ringWobble * 0.75;
      const distance = radius + jitter;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance * 1.03;
      if (point === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    ctx.lineWidth = gap * (0.6 + random() * 0.65);
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.62 + random() * 0.3})`;
    ctx.stroke();

    // 部分折痕再压一道细线，让边缘更像真实的线绳勒痕
    if (random() > 0.42) {
      ctx.lineWidth = Math.max(1, gap * 0.28);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.92)';
      ctx.stroke();
    }
  }

  // 中心被提起扎紧的位置
  const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, core * 1.75);
  coreGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  coreGradient.addColorStop(0.58, 'rgba(0, 0, 0, 0.9)');
  coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, core * 1.75, 0, Math.PI * 2);
  ctx.fill();

  // 放射状细褶
  for (let index = 0; index < spokes; index += 1) {
    const angle = (index / spokes) * Math.PI * 2 + 0.32 + random() * 0.18;
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * core * 0.5, centerY + Math.sin(angle) * core * 0.5);
    ctx.lineTo(
      centerX + Math.cos(angle) * maxRadius * (0.55 + random() * 0.35),
      centerY + Math.sin(angle) * maxRadius * (0.55 + random() * 0.35),
    );
    ctx.lineWidth = width * (0.004 + random() * 0.004);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.stroke();
  }

  ctx.restore();
}
