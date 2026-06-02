class TriangleAngleSumParallel {
  static render(container, data) {
    const wrap = document.createElement('div');
    wrap.className = 'visual-component visual-triangle';

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const w = 480, h = 360;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = w / 2, cy = h / 2 + 20;
    const size = 100;

    const A = { x: cx, y: cy - size };
    const B = { x: cx - size * 0.9, y: cy + size * 0.7 };
    const C = { x: cx + size * 0.9, y: cy + size * 0.7 };

    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(99, 102, 241, 0.06)';
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const showParallel = data.showParallel !== false;
    if (showParallel) {
      const dx = C.x - B.x;
      const ext = 40;
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(A.x - dx - ext, A.y);
      ctx.lineTo(A.x + dx + ext, A.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#10B981';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('∥ BC', A.x + dx + ext - 10, A.y - 8);

      const arrowSize = 6;
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        const ax = A.x - dx / 2 + i * dx;
        ctx.beginPath();
        ctx.moveTo(ax - arrowSize, A.y - 3);
        ctx.lineTo(ax, A.y);
        ctx.lineTo(ax - arrowSize, A.y + 3);
        ctx.stroke();
      }
    }

    const drawAngleArc = (vertex, p1, p2, color, label) => {
      const r = 22;
      const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
      const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, r, a1, a2);
      ctx.stroke();
      if (label) {
        const mid = (a1 + a2) / 2;
        const lx = vertex.x + (r + 14) * Math.cos(mid);
        const ly = vertex.y + (r + 14) * Math.sin(mid);
        ctx.fillStyle = color;
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lx, ly);
      }
    };

    const highlight = data.highlightAngle || 'A';
    if (highlight === 'A' || highlight === 'all') {
      drawAngleArc(A, B, C, '#EF4444', 'α');
    }
    if (highlight === 'B' || highlight === 'all') {
      drawAngleArc(B, A, C, '#F59E0B', 'β');
    }
    if (highlight === 'C' || highlight === 'all') {
      drawAngleArc(C, A, B, '#10B981', 'γ');
    }

    const drawLabel = (text, x, y) => {
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    };
    drawLabel('A', A.x, A.y - 18);
    drawLabel('B', B.x - 18, B.y + 10);
    drawLabel('C', C.x + 18, C.y + 10);

    ctx.fillStyle = '#64748B';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('∠A + ∠B + ∠C = 180°', cx, h - 25);

    wrap.appendChild(canvas);
    container.appendChild(wrap);
  }
}

window.TriangleAngleSumParallel = TriangleAngleSumParallel;
