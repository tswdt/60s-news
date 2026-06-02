class VisualEngine {
  static render(container, type, params) {
    const panel = document.createElement('div');
    panel.className = 'visual-panel';

    const header = document.createElement('div');
    header.className = 'visual-header';
    header.innerHTML = `
      <span class="visual-title">📊 ${params.title || '图形化讲解'}</span>
      <button class="visual-expand" onclick="this.closest('.visual-panel').classList.toggle('expanded')">⛶</button>
    `;

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'visual-canvas-wrap';

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const width = 480;
    const height = 320;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    canvasWrap.appendChild(canvas);
    panel.appendChild(header);
    panel.appendChild(canvasWrap);
    container.appendChild(panel);

    switch (type) {
      case 'plot': this.drawPlot(ctx, width, height, params); break;
      case 'geo': this.drawGeometry(ctx, width, height, params); break;
      case 'numberline': this.drawNumberLine(ctx, width, height, params); break;
      case 'coord': this.drawCoordinate(ctx, width, height, params); break;
      case 'timeline': this.drawTimeline(ctx, width, height, params); break;
      case 'molecule': this.drawMolecule(ctx, width, height, params); break;
      default: this.drawPlaceholder(ctx, width, height, params);
    }
  }

  static drawPlot(ctx, w, h, params) {
    const padding = 50;
    const plotW = w - padding * 2;
    const plotH = h - padding * 2;

    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    const xRange = params.x ? params.x.split(':').map(Number) : [-5, 5];
    const xMin = xRange[0], xMax = xRange[1];

    let yMin = -5, yMax = 5;
    const expr = params.y || 'x';

    const samplePoints = [];
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (xMax - xMin) * i / 200;
      try {
        const y = this.evalExpr(expr, x);
        if (isFinite(y)) {
          samplePoints.push({ x, y });
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        }
      } catch (e) {}
    }

    const yPad = (yMax - yMin) * 0.1;
    yMin -= yPad;
    yMax += yPad;

    const toScreenX = (x) => padding + (x - xMin) / (xMax - xMin) * plotW;
    const toScreenY = (y) => padding + (1 - (y - yMin) / (yMax - yMin)) * plotH;

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;

    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, padding);
      ctx.lineTo(sx, h - padding);
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(x, sx, h - padding + 16);
    }

    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(padding, sy);
      ctx.lineTo(w - padding, sy);
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(y, padding - 8, sy + 4);
    }

    if (yMin <= 0 && yMax >= 0) {
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padding, toScreenY(0));
      ctx.lineTo(w - padding, toScreenY(0));
      ctx.stroke();
    }

    if (xMin <= 0 && xMax >= 0) {
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(toScreenX(0), padding);
      ctx.lineTo(toScreenX(0), h - padding);
      ctx.stroke();
    }

    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let started = false;
    for (const pt of samplePoints) {
      const sx = toScreenX(pt.x);
      const sy = toScreenY(pt.y);
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();

    ctx.fillStyle = '#6366F1';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    const label = params.title || `y = ${expr}`;
    ctx.fillText(label, padding + 8, padding + 20);
  }

  static drawGeometry(ctx, w, h, params) {
    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const size = Math.min(w, h) * 0.3;
    const shapes = (params.shapes || '三角形').split(',');

    if (shapes.includes('三角形')) {
      const labels = (params.labels || 'A,B,C').split(',');
      const p1 = { x: cx, y: cy - size };
      const p2 = { x: cx - size * 0.9, y: cy + size * 0.7 };
      const p3 = { x: cx + size * 0.9, y: cy + size * 0.7 };

      ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (params.angles === 'true') {
        this.drawAngle(ctx, p2, p1, p3, '#10B981');
        this.drawAngle(ctx, p1, p2, p3, '#F59E0B');
        this.drawAngle(ctx, p1, p3, p2, '#EF4444');
      }

      const labelOffset = 20;
      this.drawLabel(ctx, labels[0] || 'A', p1.x, p1.y - labelOffset);
      this.drawLabel(ctx, labels[1] || 'B', p2.x - labelOffset, p2.y + 10);
      this.drawLabel(ctx, labels[2] || 'C', p3.x + labelOffset, p3.y + 10);

      if (params.angles === 'true') {
        ctx.fillStyle = '#64748B';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('∠A + ∠B + ∠C = 180°', cx, cy + size + 50);
      }
    } else if (shapes.includes('圆')) {
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#6366F1';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      this.drawLabel(ctx, 'O', cx + 8, cy - 8);
      this.drawLabel(ctx, 'r', cx + size / 2, cy - 10);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + size, cy);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (shapes.includes('矩形') || shapes.includes('长方形')) {
      const rw = size * 1.6, rh = size;
      ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 2.5;
      ctx.fillRect(cx - rw / 2, cy - rh / 2, rw, rh);
      ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);

      ctx.fillStyle = '#64748B';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('长', cx, cy - rh / 2 - 10);
      ctx.save();
      ctx.translate(cx - rw / 2 - 16, cy);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('宽', 0, 0);
      ctx.restore();
    }
  }

  static drawAngle(ctx, vertex, p1, p2, color) {
    const r = 20;
    const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
    const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, r, a1, a2);
    ctx.stroke();
  }

  static drawLabel(ctx, text, x, y) {
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  static drawNumberLine(ctx, w, h, params) {
    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    const padding = 60;
    const lineY = h / 2;
    const range = params.range ? params.range.split(':').map(Number) : [-10, 10];
    const min = range[0], max = range[1];
    const marks = params.marks ? params.marks.split(',').map(Number) : [];

    const toX = (v) => padding + (v - min) / (max - min) * (w - padding * 2);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding - 10, lineY);
    ctx.lineTo(w - padding + 10, lineY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w - padding + 10, lineY);
    ctx.lineTo(w - padding, lineY - 6);
    ctx.lineTo(w - padding, lineY + 6);
    ctx.fillStyle = '#334155';
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

    const colors = ['#6366F1', '#10B981', '#EF4444', '#F59E0B'];
    marks.forEach((v, i) => {
      const x = toX(v);
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x, lineY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors[i % colors.length];
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v, x, lineY - 18);
    });

    if (params.title) {
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(params.title, padding, 30);
    }
  }

  static drawCoordinate(ctx, w, h, params) {
    const padding = 50;
    const plotW = w - padding * 2;
    const plotH = h - padding * 2;

    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    const xMin = -6, xMax = 6, yMin = -6, yMax = 6;
    const toX = (v) => padding + (v - xMin) / (xMax - xMin) * plotW;
    const toY = (v) => padding + (1 - (v - yMin) / (yMax - yMin)) * plotH;

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      ctx.beginPath();
      ctx.moveTo(toX(x), padding);
      ctx.lineTo(toX(x), h - padding);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      ctx.beginPath();
      ctx.moveTo(padding, toY(y));
      ctx.lineTo(w - padding, toY(y));
      ctx.stroke();
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, toY(0));
    ctx.lineTo(w - padding, toY(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX(0), padding);
    ctx.lineTo(toX(0), h - padding);
    ctx.stroke();

    if (params.points) {
      const points = params.points.split(';').map(p => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      });

      ctx.fillStyle = '#EF4444';
      points.forEach(pt => {
        ctx.beginPath();
        ctx.arc(toX(pt.x), toY(pt.y), 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (params.lines) {
      const lines = params.lines.split(',');
      const lineColors = ['#6366F1', '#10B981', '#F59E0B'];
      lines.forEach((expr, i) => {
        ctx.strokeStyle = lineColors[i % lineColors.length];
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        for (let px = 0; px <= plotW; px++) {
          const x = xMin + (xMax - xMin) * px / plotW;
          try {
            const y = this.evalExpr(expr.replace(/y\s*=\s*/, ''), x);
            if (isFinite(y)) {
              const sy = toY(y);
              if (!started) {
                ctx.moveTo(toX(x), sy);
                started = true;
              } else {
                ctx.lineTo(toX(x), sy);
              }
            }
          } catch (e) { started = false; }
        }
        ctx.stroke();
      });
    }
  }

  static drawTimeline(ctx, w, h, params) {
    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    const events = (params.events || '').split(',').map(e => {
      const match = e.trim().match(/(.+?)\(([^)]+)\)/);
      return match ? { name: match[1].trim(), year: match[2].trim() } : null;
    }).filter(Boolean);

    if (events.length === 0) return;

    const padding = 40;
    const lineY = h / 2;
    const startX = padding + 30;
    const endX = w - padding - 30;

    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, lineY);
    ctx.lineTo(endX, lineY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, lineY);
    ctx.lineTo(endX - 10, lineY - 6);
    ctx.lineTo(endX - 10, lineY + 6);
    ctx.fillStyle = '#6366F1';
    ctx.fill();

    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    events.forEach((event, i) => {
      const x = startX + (endX - startX) * (i + 0.5) / events.length;
      const color = colors[i % colors.length];
      const above = i % 2 === 0;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, lineY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, lineY + (above ? -8 : 8));
      ctx.lineTo(x, lineY + (above ? -40 : 40));
      ctx.stroke();

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      const textY = lineY + (above ? -50 : 50);
      ctx.fillText(event.name, x, textY);

      ctx.fillStyle = color;
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(event.year, x, textY + (above ? -16 : 16));
    });
  }

  static drawMolecule(ctx, w, h, params) {
    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    const formula = params.formula || 'H2O';
    const cx = w / 2, cy = h / 2;

    const molecules = {
      'H2O': {
        atoms: [
          { el: 'O', x: 0, y: 0, color: '#EF4444', r: 24 },
          { el: 'H', x: -50, y: 40, color: '#6366F1', r: 18 },
          { el: 'H', x: 50, y: 40, color: '#6366F1', r: 18 },
        ],
        bonds: [[0, 1], [0, 2]]
      },
      'CO2': {
        atoms: [
          { el: 'C', x: 0, y: 0, color: '#334155', r: 22 },
          { el: 'O', x: -60, y: 0, color: '#EF4444', r: 24 },
          { el: 'O', x: 60, y: 0, color: '#EF4444', r: 24 },
        ],
        bonds: [[0, 1], [0, 2]]
      },
      'NaCl': {
        atoms: [
          { el: 'Na', x: -40, y: 0, color: '#6366F1', r: 22 },
          { el: 'Cl', x: 40, y: 0, color: '#10B981', r: 24 },
        ],
        bonds: [[0, 1]]
      },
    };

    const mol = molecules[formula];
    if (!mol) {
      ctx.fillStyle = '#64748B';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${formula} 分子结构`, cx, cy);
      return;
    }

    mol.bonds.forEach(([a, b]) => {
      const atomA = mol.atoms[a];
      const atomB = mol.atoms[b];
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + atomA.x, cy + atomA.y);
      ctx.lineTo(cx + atomB.x, cy + atomB.y);
      ctx.stroke();
    });

    mol.atoms.forEach(atom => {
      ctx.fillStyle = atom.color;
      ctx.beginPath();
      ctx.arc(cx + atom.x, cy + atom.y, atom.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = `bold ${atom.r * 0.8}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(atom.el, cx + atom.x, cy + atom.y);
    });

    ctx.fillStyle = '#64748B';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`分子式: ${formula}`, cx, h - 30);
  }

  static drawPlaceholder(ctx, w, h, params) {
    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(params.title || '图形化讲解', w / 2, h / 2);
  }

  static evalExpr(expr, x) {
    const safe = expr
      .replace(/\^/g, '**')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/abs/g, 'Math.abs')
      .replace(/log/g, 'Math.log')
      .replace(/pi/g, 'Math.PI')
      .replace(/e(?![a-z])/g, 'Math.E');
    return new Function('x', `return ${safe}`)(x);
  }
}

window.VisualEngine = VisualEngine;
