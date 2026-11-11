/**
 * 豆结扎染：用豆粒或石子包住布面扎紧，形成大小不一的圆点与晕圈。
 */
export function drawBean(ctx, width, height, params = {}, random = Math.random) {
  const count = Math.max(10, Math.min(90, Number(params.count) || 34));
  const minRadius = (Number(params.minRadius) || 10) * (width / 900);
  const maxRadius = (Number(params.maxRadius) || 26) * (width / 900);
  const halo = Math.max(1.15, Number(params.halo) || 1.55);
  const clusterCount = Math.max(2, Math.min(10, Number(params.clusters) || 5));
  const spread = Number(params.spread) || 0.72;
  const margin = Math.min(width, height) * 0.07;

  const clusters = Array.from({ length: clusterCount }, () => ({
    x: margin + random() * (width - margin * 2),
    y: margin + random() * (height - margin * 2),
    radius: Math.min(width, height) * (0.12 + random() * 0.16) * spread,
  }));

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-out';

  for (let index = 0; index < count; index += 1) {
    const cluster = clusters[Math.floor(random() * clusters.length)];
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * cluster.radius;
    const x = clamp(cluster.x + Math.cos(angle) * distance, margin, width - margin);
    const y = clamp(cluster.y + Math.sin(angle) * distance, margin, height - margin);
    const radius = minRadius + random() * (maxRadius - minRadius);

    // 外圈柔和晕染
    const outer = ctx.createRadialGradient(x, y, 0, x, y, radius * halo);
    outer.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
    outer.addColorStop(0.58, 'rgba(0, 0, 0, 0.28)');
    outer.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(x, y, radius * halo, 0, Math.PI * 2);
    ctx.fill();

    // 被豆粒顶住的核心
    const inner = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.82);
    inner.addColorStop(0, 'rgba(0, 0, 0, 1)');
    inner.addColorStop(0.72, 'rgba(0, 0, 0, 0.92)');
    inner.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.82, 0, Math.PI * 2);
    ctx.fill();
  }

  // 细小的散点，让画面更像手工扎染
  const speckles = Math.round(count * 0.7);
  for (let index = 0; index < speckles; index += 1) {
    const x = margin + random() * (width - margin * 2);
    const y = margin + random() * (height - margin * 2);
    const radius = 2 + random() * 6;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.8);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${0.32 + random() * 0.3})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
