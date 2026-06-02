class BalanceScale {
  static render(container, data) {
    const wrap = document.createElement('div');
    wrap.className = 'visual-component visual-balance-scale';

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const w = 480, h = 340;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const leftExpr = data.left || '2x + 3';
    const rightExpr = data.right || '7';
    const balanced = data.balanced !== false;

    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const pivotY = 60;
    const beamLen = 360;
    const tilt = balanced ? 0 : 8;

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(cx, pivotY);
    ctx.lineTo(cx - 10, pivotY - 20);
    ctx.lineTo(cx + 10, pivotY - 20);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - beamLen / 2, pivotY + tilt);
    ctx.lineTo(cx + beamLen / 2, pivotY - tilt);
    ctx.stroke();

    const drawPan = (x, y, expr, color) => {
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, pivotY + (x < cx ? tilt : -tilt));
      ctx.lineTo(x - 30, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, pivotY + (x < cx ? tilt : -tilt));
      ctx.lineTo(x + 30, y);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, 50, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(expr, x, y - 8);
    };

    const leftX = cx - beamLen / 2;
    const rightX = cx + beamLen / 2;
    const panY = pivotY + 80;

    drawPan(leftX, panY, leftExpr, 'rgba(99, 102, 241, 0.15)');
    drawPan(rightX, panY, rightExpr, 'rgba(16, 185, 129, 0.15)');

    ctx.fillStyle = '#334155';
    ctx.fillRect(cx - 4, pivotY + 10, 8, 140);

    ctx.fillStyle = '#334155';
    ctx.fillRect(cx - 50, pivotY + 150, 100, 8);

    const statusY = pivotY + 190;
    if (balanced) {
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚖️ 平衡', cx, statusY);

      ctx.fillStyle = '#64748B';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(`${leftExpr} = ${rightExpr}`, cx, statusY + 24);
    } else {
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚖️ 不平衡', cx, statusY);

      ctx.fillStyle = '#64748B';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(`${leftExpr} ≠ ${rightExpr}`, cx, statusY + 24);

      ctx.fillStyle = '#F59E0B';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText('需要找到 x 的值使天平平衡', cx, statusY + 48);
    }

    wrap.appendChild(canvas);
    container.appendChild(wrap);
  }
}

window.BalanceScale = BalanceScale;
