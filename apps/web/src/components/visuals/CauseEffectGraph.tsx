interface CauseNode {
  id: string;
  label: string;
  description: string;
}

interface Props {
  stepIndex: number;
  data?: {
    title?: string;
    center?: string;
    nodes?: CauseNode[];
  };
}

const DEFAULT_NODES: CauseNode[] = [
  { id: 'politics', label: '政治制度', description: '制度较成熟，国家治理能力较强' },
  { id: 'economy', label: '经济发展', description: '农业、手工业、商业发展' },
  { id: 'military', label: '军事力量', description: '前期军事实力强，边疆控制力强' },
  { id: 'culture', label: '文化开放', description: '科举、诗歌、宗教和多民族文化交流活跃' },
  { id: 'foreign', label: '对外交流', description: '丝绸之路和国际交往频繁' },
];

export default function CauseEffectGraph({ stepIndex, data }: Props) {
  const title = data?.title || '因果分析';
  const center = data?.center || '核心';
  const nodes = data?.nodes && data.nodes.length > 0 ? data.nodes : DEFAULT_NODES;
  const step = Math.max(1, Math.min(nodes.length, stepIndex ?? 1));
  const activeIdx = step - 1;

  const svgW = 700;
  const svgH = 460;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const radius = 150;

  const nodePositions = nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          borderRadius: 14,
          maxWidth: '100%',
          height: 'auto',
          boxShadow: '0 2px 12px rgba(245,158,11,0.08)',
        }}
      >
        <text
          x={cx}
          y={28}
          textAnchor="middle"
          style={{ fontSize: 18, fontWeight: 700, fill: '#92400E' }}
        >
          {title}
        </text>

        {nodes.map((node, i) => {
          const pos = nodePositions[i];
          const isActive = i === activeIdx;
          const isPast = i < activeIdx;

          const lineColor = isActive ? '#F59E0B' : isPast ? '#D97706' : '#E5E7EB';
          const lineW = isActive ? 3 : 1.5;

          return (
            <g key={node.id}>
              <line
                x1={cx}
                y1={cy}
                x2={pos.x}
                y2={pos.y}
                stroke={lineColor}
                strokeWidth={lineW}
                strokeDasharray={isPast || isActive ? 'none' : '4,4'}
              />
              {(isPast || isActive) && (
                <polygon
                  points={`${cx + (pos.x - cx) * 0.7},${cy + (pos.y - cy) * 0.7 - 4} ${cx + (pos.x - cx) * 0.7},${cy + (pos.y - cy) * 0.7 + 4} ${cx + (pos.x - cx) * 0.75},${cy + (pos.y - cy) * 0.75}`}
                  fill={lineColor}
                />
              )}
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={44} fill="#FEF3C7" stroke="#F59E0B" strokeWidth={3} />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          style={{ fontSize: 14, fontWeight: 700, fill: '#78350F' }}
        >
          {center.length > 4 ? center.slice(0, 4) : center}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          style={{ fontSize: 10, fill: '#92400E' }}
        >
          {center.length > 4 ? center.slice(4) : ''}
        </text>

        {nodes.map((node, i) => {
          const pos = nodePositions[i];
          const isActive = i === activeIdx;
          const isPast = i < activeIdx;

          const boxW = isActive ? 100 : 80;
          const boxH = isActive ? 36 : 28;
          const boxRx = 8;

          const fillColor = isActive ? '#F59E0B' : isPast ? '#FDE68A' : '#F3F4F6';
          const strokeColor = isActive ? '#92400E' : isPast ? '#D97706' : '#D1D5DB';
          const textColor = isActive ? '#FFFFFF' : isPast ? '#78350F' : '#6B7280';

          return (
            <g key={node.id}>
              <rect
                x={pos.x - boxW / 2}
                y={pos.y - boxH / 2}
                width={boxW}
                height={boxH}
                rx={boxRx}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              {isActive && (
                <rect
                  x={pos.x - boxW / 2 - 3}
                  y={pos.y - boxH / 2 - 3}
                  width={boxW + 6}
                  height={boxH + 6}
                  rx={boxRx + 2}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  opacity={0.5}
                >
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                </rect>
              )}
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                style={{
                  fontSize: isActive ? 14 : 12,
                  fontWeight: isActive ? 700 : 500,
                  fill: textColor,
                }}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {activeIdx >= 0 && activeIdx < nodes.length && (
          <g>
            <rect
              x={40}
              y={svgH - 90}
              width={svgW - 80}
              height={70}
              rx={10}
              fill="white"
              stroke="#F59E0B"
              strokeWidth={1.5}
              opacity={0.95}
            />
            <text
              x={60}
              y={svgH - 62}
              style={{ fontSize: 14, fontWeight: 700, fill: '#78350F' }}
            >
              {nodes[activeIdx].label}
            </text>
            <text
              x={60}
              y={svgH - 40}
              style={{ fontSize: 12, fill: '#92400E' }}
            >
              {nodes[activeIdx].description || ''}
            </text>
          </g>
        )}
      </svg>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {nodes.map((node, i) => (
          <div
            key={node.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 6,
              background: i === activeIdx ? '#FEF3C7' : i < activeIdx ? '#FDE68A' : 'transparent',
              border: i === activeIdx ? '1.5px solid #F59E0B' : i < activeIdx ? '1px solid #D97706' : '1.5px solid transparent',
              transition: 'all 0.2s',
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: i === activeIdx ? 10 : 7,
                height: i === activeIdx ? 10 : 7,
                borderRadius: '50%',
                background: i === activeIdx ? '#F59E0B' : i < activeIdx ? '#D97706' : '#D1D5DB',
                transition: 'all 0.2s',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: i === activeIdx ? 700 : 500,
                color: i === activeIdx ? '#78350F' : i < activeIdx ? '#92400E' : '#9CA3AF',
                whiteSpace: 'nowrap',
              }}
            >
              {node.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
