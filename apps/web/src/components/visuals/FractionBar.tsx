import { useRef, useEffect } from 'react';

interface Props {
  data?: {
    numerator?: number;
    denominator?: number;
    label?: string;
  };
}

export default function FractionBar({ data = {} }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 480,
      h = 300;
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const numerator = data.numerator || 1;
    const denominator = data.denominator || 4;
    const label = data.label || `${numerator}/${denominator}`;

    ctx.fillStyle = '#FAFBFF';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, w / 2, 35);

    const barW = w - 100;
    const barH = 50;
    const startX = 50;
    const startY = 60;
    const cellW = barW / denominator;

    for (let i = 0; i < denominator; i++) {
      const x = startX + i * cellW;
      const filled = i < numerator;
      ctx.fillStyle = filled ? '#6366F1' : '#E2E8F0';
      ctx.fillRect(x, startY, cellW, barH);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, startY, cellW, barH);
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, barW, barH);

    for (let i = 1; i < denominator; i++) {
      const x = startX + i * cellW;
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + barH);
      ctx.stroke();
    }

    ctx.fillStyle = '#64748B';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < denominator; i++) {
      const x = startX + (i + 0.5) * cellW;
      ctx.fillText(String(i + 1), x, startY + barH + 18);
    }

    const bar2Y = startY + barH + 50;
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('对比：', startX, bar2Y - 8);

    const compareDenominators = [2, 3, 4, 5, 6, 8];
    const compareY = bar2Y + 10;
    const bar2H = 30;
    const gap = 8;
    const totalBars = compareDenominators.length;
    const bar2W = (barW - (totalBars - 1) * gap) / totalBars;

    compareDenominators.forEach((d, idx) => {
      const bx = startX + idx * (bar2W + gap);
      const fillW = bar2W * (numerator / denominator);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(bx, compareY, bar2W, bar2H);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.fillRect(bx, compareY, fillW, bar2H);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, compareY, bar2W, bar2H);
      ctx.fillStyle = '#64748B';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`1/${d}`, bx + bar2W / 2, compareY + bar2H + 14);
    });

    ctx.fillStyle = '#64748B';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${numerator}/${denominator} = ${numerator} ÷ ${denominator} = ${(numerator / denominator).toFixed(4)}`,
      w / 2,
      h - 20,
    );
  }, [data]);

  return (
    <div className="visual-component visual-fraction-bar">
      <canvas
        ref={canvasRef}
        style={{ width: 480, height: 300, borderRadius: 8, background: 'white' }}
      />
    </div>
  );
}
