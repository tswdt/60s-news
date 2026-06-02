class NumberLine {
  static render(container, data) {
    const wrap = document.createElement('div');
    wrap.className = 'visual-component visual-number-line';

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const w = 480, h = 280;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const range = data.range || [-5, 5];
    const min = range[0], max = range[1];
    const marks = data.marks || [];
    const title = data.title || '';

    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    if (title) {
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 40, 30);
    }

    const padding = 50;
    const lineY = h / 2 + 10;
    const toX = (v) => padding + (v - min) / (max - min) * (w - padding * 2);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding - 15, lineY);
    ctx.lineTo(w - padding + 15, lineY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w - padding + 15, lineY);
    ctx.lineTo(w - padding + 5, lineY - 6);
    ctx.lineTo(w - padding + 5, lineY + 6);
    ctx.closePath();
    ctx.fillStyle = '#334155';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(padding - 15, lineY);
    ctx.lineTo(padding - 5, lineY - 6);
    ctx.lineTo(padding - 5, lineY + 6);
    ctx.closePath();
    ctx.fill();

    for (let v = Math.ceil(min); v <= max; v++) {
      const x = toX(v);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, lineY - 6);
      ctx.lineTo(x, lineY + 6);
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v, x, lineY + 22);
    }

    const colors = ['#6366F1', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'];
    marks.forEach((v, i) => {
      const x = toX(v);
      const color = colors[i % colors.length];

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, lineY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x, lineY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v, x, lineY - 18);
    });

    wrap.appendChild(canvas);
    container.appendChild(wrap);
  }
}

window.NumberLine = NumberLine;
