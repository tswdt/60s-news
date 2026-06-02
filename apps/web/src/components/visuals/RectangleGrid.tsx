interface Props {
  stepIndex: number;
  rows?: number;
  cols?: number;
  unitLabel?: string;
}

const ROW_HIGHLIGHT = [
  'rgba(99, 102, 241, 0.40)',
  'rgba(16, 185, 129, 0.40)',
  'rgba(245, 158, 11, 0.40)',
  'rgba(239, 68, 68, 0.40)',
  'rgba(139, 92, 246, 0.40)',
  'rgba(236, 72, 153, 0.40)',
  'rgba(14, 165, 233, 0.40)',
  'rgba(234, 88, 12, 0.40)',
];

const ROW_BORDER = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#0EA5E9',
  '#EA580C',
];

const CELL_DEFAULT_FILL = 'rgba(99, 102, 241, 0.10)';
const CELL_DEFAULT_STROKE = '#94A3B8';
const COLOR_ACCENT = '#6366F1';
const COLOR_FORMULA = '#4338CA';

export default function RectangleGrid({
  stepIndex,
  rows: rowsProp,
  cols: colsProp,
  unitLabel: unitLabelProp,
}: Props) {
  const rows = rowsProp || 3;
  const cols = colsProp || 4;
  const unitLabel = unitLabelProp || '1㎡';
  const step = Math.max(0, Math.min(4, stepIndex ?? 0));

  const maxCellSize = 80;
  const minCellSize = 40;
  const cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.floor(520 / cols), Math.floor(380 / rows)));

  const gridW = cols * cellSize;
  const gridH = rows * cellSize;

  const svgW = Math.max(gridW + 160, 480);
  const svgH = gridH + 200;

  const offsetX = (svgW - gridW) / 2;
  const offsetY = 60;

  const noteY = offsetY + gridH + 40;

  const isRowHighlighted = (r: number) => {
    if (step === 0) return false;
    if (step === 1) return r === 0;
    return true;
  };

  const getCellFill = (r: number) => {
    if (step === 0) return CELL_DEFAULT_FILL;
    if (isRowHighlighted(r)) return ROW_HIGHLIGHT[r % ROW_HIGHLIGHT.length];
    return 'rgba(203, 213, 225, 0.15)';
  };

  const getCellStroke = (r: number) => {
    if (step === 0) return CELL_DEFAULT_STROKE;
    if (isRowHighlighted(r)) return ROW_BORDER[r % ROW_BORDER.length];
    return '#E2E8F0';
  };

  const getCellTextOpacity = (r: number) => {
    if (step === 0) return 0.9;
    if (isRowHighlighted(r)) return 1;
    return 0.3;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{
          background: 'linear-gradient(135deg, #FAFBFF 0%, #F0F1FF 100%)',
          borderRadius: 14,
          maxWidth: '100%',
          height: 'auto',
          boxShadow: '0 2px 12px rgba(99,102,241,0.08)',
        }}
      >
        {step >= 1 && (
          <text
            x={offsetX + gridW / 2}
            y={offsetY - 24}
            textAnchor="middle"
            dominantBaseline="central"
            fill={COLOR_ACCENT}
            fontSize={16}
            fontWeight={700}
            fontFamily="Inter, system-ui, sans-serif"
          >
            {cols} 列（长 = {cols}）
          </text>
        )}

        {step >= 2 && (
          <text
            x={offsetX - 36}
            y={offsetY + gridH / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={COLOR_ACCENT}
            fontSize={16}
            fontWeight={700}
            fontFamily="Inter, system-ui, sans-serif"
            transform={`rotate(-90, ${offsetX - 36}, ${offsetY + gridH / 2})`}
          >
            {rows} 行（宽 = {rows}）
          </text>
        )}

        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;
            const highlighted = isRowHighlighted(r);
            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={x + 1.5}
                  y={y + 1.5}
                  width={cellSize - 3}
                  height={cellSize - 3}
                  rx={4}
                  fill={getCellFill(r)}
                  stroke={getCellStroke(r)}
                  strokeWidth={highlighted ? 2 : 1}
                />
                <text
                  x={x + cellSize / 2}
                  y={y + cellSize / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={highlighted ? '#1E293B' : '#64748B'}
                  fontSize={cellSize < 48 ? 11 : 13}
                  fontWeight={600}
                  fontFamily="Inter, system-ui, sans-serif"
                  opacity={getCellTextOpacity(r)}
                >
                  {unitLabel}
                </text>
              </g>
            );
          }),
        )}

        <rect
          x={offsetX}
          y={offsetY}
          width={gridW}
          height={gridH}
          fill="none"
          stroke="#334155"
          strokeWidth={3}
          rx={2}
        />

        {step === 1 && (
          <g>
            <rect
              x={offsetX - 4}
              y={offsetY - 4}
              width={gridW + 8}
              height={cellSize + 8}
              fill="none"
              stroke={ROW_BORDER[0]}
              strokeWidth={3}
              rx={8}
              strokeDasharray="8 4"
            />
            <rect
              x={svgW / 2 - 140}
              y={noteY - 22}
              width={280}
              height={44}
              rx={10}
              fill="#EEF2FF"
              stroke={ROW_BORDER[0]}
              strokeWidth={1.5}
            />
            <text
              x={svgW / 2}
              y={noteY}
              textAnchor="middle"
              dominantBaseline="central"
              fill={COLOR_FORMULA}
              fontSize={17}
              fontWeight={700}
              fontFamily="Inter, system-ui, sans-serif"
            >
              一排有 {cols} 个小方格
            </text>
          </g>
        )}

        {step === 2 && (
          <g>
            {Array.from({ length: rows }, (_, r) => (
              <rect
                key={r}
                x={offsetX - 4}
                y={offsetY + r * cellSize - 4}
                width={gridW + 8}
                height={cellSize + 8}
                fill="none"
                stroke={ROW_BORDER[r % ROW_BORDER.length]}
                strokeWidth={2.5}
                rx={8}
                strokeDasharray="8 4"
              />
            ))}
            <rect
              x={svgW / 2 - 120}
              y={noteY - 22}
              width={240}
              height={44}
              rx={10}
              fill="#EEF2FF"
              stroke={COLOR_ACCENT}
              strokeWidth={1.5}
            />
            <text
              x={svgW / 2}
              y={noteY}
              textAnchor="middle"
              dominantBaseline="central"
              fill={COLOR_FORMULA}
              fontSize={17}
              fontWeight={700}
              fontFamily="Inter, system-ui, sans-serif"
            >
              一共有 {rows} 排
            </text>
          </g>
        )}

        {step === 3 && (
          <g>
            <rect
              x={svgW / 2 - 140}
              y={noteY - 28}
              width={280}
              height={56}
              rx={12}
              fill="#EEF2FF"
              stroke={COLOR_ACCENT}
              strokeWidth={2}
            />
            <text
              x={svgW / 2}
              y={noteY - 4}
              textAnchor="middle"
              dominantBaseline="central"
              fill={COLOR_FORMULA}
              fontSize={26}
              fontWeight={800}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {cols} × {rows} = {cols * rows}
            </text>
            <text
              x={svgW / 2}
              y={noteY + 20}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#64748B"
              fontSize={13}
              fontWeight={500}
              fontFamily="Inter, system-ui, sans-serif"
            >
              每排 {cols} 个，共 {rows} 排，总共 {cols * rows} {unitLabel}
            </text>
          </g>
        )}

        {step === 4 && (
          <g>
            <line
              x1={offsetX}
              y1={offsetY + gridH + 14}
              x2={offsetX + gridW}
              y2={offsetY + gridH + 14}
              stroke={COLOR_ACCENT}
              strokeWidth={2.5}
            />
            <text
              x={offsetX + gridW / 2}
              y={offsetY + gridH + 28}
              textAnchor="middle"
              dominantBaseline="central"
              fill={COLOR_ACCENT}
              fontSize={14}
              fontWeight={700}
              fontFamily="Inter, system-ui, sans-serif"
            >
              长 = {cols}
            </text>

            <line
              x1={offsetX + gridW + 14}
              y1={offsetY}
              x2={offsetX + gridW + 14}
              y2={offsetY + gridH}
              stroke={COLOR_ACCENT}
              strokeWidth={2.5}
            />
            <text
              x={offsetX + gridW + 30}
              y={offsetY + gridH / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={COLOR_ACCENT}
              fontSize={14}
              fontWeight={700}
              fontFamily="Inter, system-ui, sans-serif"
            >
              宽 = {rows}
            </text>

            <rect
              x={svgW / 2 - 170}
              y={noteY - 8}
              width={340}
              height={64}
              rx={12}
              fill="#EEF2FF"
              stroke={COLOR_ACCENT}
              strokeWidth={2}
            />
            <text
              x={svgW / 2}
              y={noteY + 12}
              textAnchor="middle"
              dominantBaseline="central"
              fill={COLOR_FORMULA}
              fontSize={22}
              fontWeight={800}
              fontFamily="Inter, system-ui, sans-serif"
            >
              长方形面积 = 长 × 宽
            </text>
            <text
              x={svgW / 2}
              y={noteY + 38}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#64748B"
              fontSize={14}
              fontWeight={500}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {cols} × {rows} = {cols * rows} {unitLabel}
            </text>
          </g>
        )}
      </svg>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          `${cols}×${rows} 网格`,
          '一排几个',
          '共几排',
          '乘法算式',
          '面积公式',
        ].map((label, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              background: i === step ? '#EEF2FF' : 'transparent',
              border: i === step ? '1.5px solid #6366F1' : '1.5px solid transparent',
              transition: 'all 0.2s',
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: i === step ? 10 : 7,
                height: i === step ? 10 : 7,
                borderRadius: '50%',
                background: i === step ? '#6366F1' : '#CBD5E1',
                transition: 'all 0.2s',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: i === step ? 700 : 500,
                color: i === step ? '#4338CA' : '#94A3B8',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
