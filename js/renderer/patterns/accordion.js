/**
 * 风琴折叠：连续折叠后分段扎紧，形成层叠的水波与折痕。
 */
export function drawAccordion(ctx, width, height, params = {}, random = Math.random) {
  const folds = Math.max(8, Math.min(36, Number(params.folds) || 22));
  const amplitude = (Number(params.amplitude) || 10) * (width / 900);
  const gap = Math.max(1.5, Number(params.gap) || 7) * (width / 900);
  const slant = Number(params.slant) || 0.12;
  const bandHeight = height / folds;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const edgeFade = ctx.createLinearGradient(0, 0, width, 0);
  edgeFade.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
  edgeFade.addColorStop(0.1, 'rgba(0, 0, 0, 0.55)');
  edgeFade.addColorStop(0.5, 'rgba(0, 0, 0, 0.95)');
  edgeFade.addColorStop(0.9, 'rgba(0, 0, 0, 0.55)');
  edgeFade.addColorStop(1, 'rgba(0, 0, 0, 0.08)');

  for (let index = 0; index < folds; index += 1) {
    const baseY = (index + 0.5) * bandHeight;
    const phase = index * 0.72 + random() * 0.6;
    const wave = 1.4 + random() * 0.9;

    ctx.beginPath();
    for (let segment = 0; segment <= 48; segment += 1) {
      const t = segment / 48;
      const x = t * width;
      const y = baseY
        + Math.sin(t * Math.PI * 2 * wave + phase) * amplitude
        + (t - 0.5) * height * slant * 0.06;
      if (segment === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.lineWidth = gap * (0.62 + random() * 0.58);
    ctx.strokeStyle = edgeFade;
    ctx.stroke();

    // 折痕阴影线
    if (random() > 0.36) {
      ctx.lineWidth = Math.max(1, gap * 0.3);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.74)';
      ctx.stroke();
    }
  }

  // 纵向折线，模拟反复折叠的压痕
  const creaseCount = 18;
  for (let index = 0; index < creaseCount; index += 1) {
    const x = (index + 0.5) * (width / creaseCount) + (random() - 0.5) * 10;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x + Math.sin(index) * 8, height + 10);
    ctx.lineWidth = 0.8 + random() * 1.4;
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.08 + random() * 0.12})`;
    ctx.stroke();
  }

  ctx.restore();
}
