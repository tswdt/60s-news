class RectangleGrid {
  static render(container, data) {
    const wrap = document.createElement('div');
    wrap.className = 'visual-component visual-rect-grid';

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const w = 480, h = 360;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const rows = data.rows || 3;
    const cols = data.cols || 4;
    const label = data.label || `${rows}×${cols}`;

    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    const cellSize = Math.min(60, Math.floor((w - 120) / cols), Math.floor((h - 140) / rows));
    const gridW = cols * cellSize;
    const gridH = rows * cellSize;
    const startX = (w - gridW) / 2;
    const startY = (h - gridH) / 2 + 10;

    const colors = [
      'rgba(99, 102, 241, 0.15)',
      'rgba(16, 185, 129, 0.15)',
      'rgba(245, 158, 11, 0.15)',
      'rgba(239, 68, 68, 0.15)',
      'rgba(139, 92, 246, 0.15)',
      'rgba(236, 72, 153, 0.15)',
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        ctx.fillStyle = colors[(r + c) % colors.length];
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(startX, startY, gridW, gridH);

    ctx.fillStyle = '#6366F1';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${cols} 列`, startX + gridW / 2, startY - 12);

    ctx.save();
    ctx.translate(startX - 14, startY + gridH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${rows} 行`, 0, 0);
    ctx.restore();

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} = ${rows * cols}`, w / 2, startY + gridH + 40);

    ctx.fillStyle = '#64748B';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(`面积 = ${rows} × ${cols} = ${rows * cols} 个格子`, w / 2, startY + gridH + 65);

    wrap.appendChild(canvas);
    container.appendChild(wrap);
  }
}

window.RectangleGrid = RectangleGrid;
