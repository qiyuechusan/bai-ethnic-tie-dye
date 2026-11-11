/**
 * 绘制棉布底纹：米白底色、经纬线、轻微杂色和淡淡的旧布痕。
 * 全部使用本地 Canvas 绘制，不依赖外部图片。
 */
export function drawCloth(ctx, width, height, random) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, '#faf7ef');
  base.addColorStop(0.55, '#f7f3e8');
  base.addColorStop(1, '#efe9da');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // 经纬线
  const step = Math.max(7, Math.round(width / 110));
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += step) {
    ctx.strokeStyle = x % (step * 2) === 0 ? 'rgba(120, 108, 86, 0.055)' : 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += step) {
    ctx.strokeStyle = y % (step * 2) === 0 ? 'rgba(120, 108, 86, 0.045)' : 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 细小杂色，模拟棉纤维
  const speckles = Math.round((width * height) / 620);
  for (let i = 0; i < speckles; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const size = random() < 0.86 ? 1 : 2;
    ctx.fillStyle = random() < 0.55
      ? `rgba(107, 97, 76, ${0.025 + random() * 0.04})`
      : `rgba(255, 255, 255, ${0.1 + random() * 0.14})`;
    ctx.fillRect(x, y, size, size);
  }

  // 淡淡的旧布痕
  for (let i = 0; i < 18; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const radius = 18 + random() * 90;
    const stain = ctx.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, `rgba(138, 123, 91, ${0.012 + random() * 0.022})`);
    stain.addColorStop(1, 'rgba(138, 123, 91, 0)');
    ctx.fillStyle = stain;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
