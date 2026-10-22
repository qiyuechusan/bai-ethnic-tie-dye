/**
 * 缝扎蝴蝶：用虚线模拟针脚，沿蝴蝶轮廓抽紧后防染。
 */
export function drawStitch(ctx, width, height, params = {}, random = Math.random) {
  const rows = Math.max(2, Math.min(9, Number(params.rows) || 6));
  const cols = Math.max(2, Math.min(7, Number(params.cols) || 5));
  const gap = Math.max(1.5, Number(params.gap) || 6) * (width / 900);
  const baseAngle = ((Number(params.angle) || -18) * Math.PI) / 180;
  const margin = width * 0.09;
  const cellWidth = (width - margin * 2) / Math.max(1, cols - 1);
  const cellHeight = (height - margin * 2) / Math.max(1, rows - 1);
  const baseSize = Math.min(cellWidth, cellHeight) * 0.43;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const centerX = margin + col * cellWidth + (random() - 0.5) * cellWidth * 0.16;
      const centerY = margin + row * cellHeight + (random() - 0.5) * cellHeight * 0.16;
      const size = baseSize * (0.82 + random() * 0.3);
      const angle = baseAngle + (random() - 0.5) * 0.42;

      drawButterfly(ctx, centerX, centerY, size, angle, gap, random);
    }
  }

  // 布面横向的抽紧褶皱
  const wrinkles = 12;
  for (let index = 0; index < wrinkles; index += 1) {
    const y = (index + 0.5) * (height / wrinkles) + (random() - 0.5) * 12;
    ctx.beginPath();
    ctx.moveTo(-10, y);
    for (let segment = 1; segment <= 12; segment += 1) {
      const x = (segment / 12) * width;
      ctx.lineTo(x, y + Math.sin(segment * 0.9 + index) * 5);
    }
    ctx.lineWidth = 1 + random() * 1.6;
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 + random() * 0.12})`;
    ctx.stroke();
  }

  ctx.restore();
}

function drawButterfly(ctx, centerX, centerY, size, angle, gap, random) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.scale(size, size);

  const lineWidth = gap / size;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([gap / size, (gap * 0.95) / size]);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';

  // 左、右上翅
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-0.14, -0.52, -0.8, -0.76, -0.82, -0.2);
  ctx.bezierCurveTo(-0.83, 0.16, -0.36, 0.22, 0, 0.06);
  ctx.bezierCurveTo(0.36, 0.22, 0.83, 0.16, 0.82, -0.2);
  ctx.bezierCurveTo(0.8, -0.76, 0.14, -0.52, 0, 0);
  ctx.stroke();

  // 左、右下翅
  ctx.beginPath();
  ctx.moveTo(0, 0.07);
  ctx.bezierCurveTo(-0.4, 0.26, -0.58, 0.7, -0.2, 0.68);
  ctx.bezierCurveTo(-0.04, 0.67, 0.01, 0.34, 0, 0.07);
  ctx.bezierCurveTo(0.01, 0.34, 0.04, 0.67, 0.2, 0.68);
  ctx.bezierCurveTo(0.58, 0.7, 0.4, 0.26, 0, 0.07);
  ctx.stroke();

  // 身体
  ctx.setLineDash([]);
  ctx.lineWidth = lineWidth * 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -0.28);
  ctx.bezierCurveTo(0.055, -0.15, 0.055, 0.28, 0, 0.42);
  ctx.bezierCurveTo(-0.055, 0.28, -0.055, -0.15, 0, -0.28);
  ctx.stroke();

  // 触角
  ctx.lineWidth = lineWidth * 0.55;
  ctx.beginPath();
  ctx.moveTo(-0.015, -0.26);
  ctx.quadraticCurveTo(-0.12, -0.4, -0.2, -0.36);
  ctx.moveTo(0.015, -0.26);
  ctx.quadraticCurveTo(0.12, -0.4, 0.2, -0.36);
  ctx.stroke();

  // 翅脉
  ctx.lineWidth = lineWidth * 0.42;
  ctx.globalAlpha = 0.62;
  ctx.beginPath();
  ctx.moveTo(-0.02, -0.03);
  ctx.lineTo(-0.62, -0.28);
  ctx.moveTo(-0.02, 0.08);
  ctx.lineTo(-0.44, 0.48);
  ctx.moveTo(0.02, -0.03);
  ctx.lineTo(0.62, -0.28);
  ctx.moveTo(0.02, 0.08);
  ctx.lineTo(0.44, 0.48);
  ctx.stroke();

  // 针脚眼
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  const stitches = 9;
  for (let index = 0; index < stitches; index += 1) {
    const y = -0.34 + (index / (stitches - 1)) * 0.8;
    ctx.beginPath();
    ctx.arc(0, y, Math.max(0.008, lineWidth * 0.18), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 + random() * 0.4})`;
    ctx.fill();
  }

  ctx.restore();
}
