interface TimelineEvent {
  time: string;
  title: string;
  description?: string;
  highlight?: boolean;
}

interface Props {
  stepIndex: number;
  data?: {
    title?: string;
    events?: TimelineEvent[];
  };
}

const DEFAULT_SANGUO_EVENTS: TimelineEvent[] = [
  { time: '184年', title: '黄巾起义', description: '张角领导农民起义，东汉末年乱世开始' },
  { time: '189年', title: '董卓进京', description: '董卓率兵入洛阳，把持朝政' },
  { time: '200年', title: '官渡之战', description: '曹操以少胜多击败袁绍' },
  { time: '208年', title: '赤壁之战', description: '孙刘联军火烧赤壁，大败曹操' },
  { time: '220年', title: '曹丕称帝，魏建立', description: '曹丕篡汉，建立曹魏' },
  { time: '221年', title: '刘备称帝，蜀汉建立', description: '刘备在成都称帝，建立蜀汉' },
  { time: '229年', title: '孙权称帝，吴建立', description: '孙权在建业称帝，三国鼎立形成' },
  { time: '280年', title: '西晋灭吴，三国结束', description: '西晋统一天下，三国时代终结' },
];

export default function TimelineVisual({ stepIndex, data }: Props) {
  const events = data?.events && data.events.length > 0 ? data.events : DEFAULT_SANGUO_EVENTS;
  const title = data?.title || '三国时期';
  const step = Math.max(0, Math.min(events.length - 1, stepIndex ?? 0));
  const activeIdx = step;

  const svgW = 760;
  const lineY = 80;
  const eventSpacing = Math.min(90, (svgW - 80) / events.length);
  const startX = (svgW - eventSpacing * (events.length - 1)) / 2;
  const svgH = 280;

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
          x={svgW / 2}
          y={32}
          textAnchor="middle"
          style={{ fontSize: 18, fontWeight: 700, fill: '#92400E' }}
        >
          {title}
        </text>

        <line
          x1={startX - 20}
          y1={lineY}
          x2={startX + eventSpacing * (events.length - 1) + 20}
          y2={lineY}
          stroke="#D97706"
          strokeWidth={3}
          strokeLinecap="round"
        />

        <line
          x1={startX - 20}
          y1={lineY}
          x2={startX + eventSpacing * activeIdx}
          y2={lineY}
          stroke="#F59E0B"
          strokeWidth={4}
          strokeLinecap="round"
        />

        {events.map((evt, i) => {
          const cx = startX + eventSpacing * i;
          const isActive = i === activeIdx;
          const isPast = i < activeIdx;

          const dotR = isActive ? 10 : 6;
          const dotFill = isActive ? '#F59E0B' : isPast ? '#D97706' : '#FDE68A';
          const dotStroke = isActive ? '#92400E' : '#D97706';

          const labelY = i % 2 === 0 ? lineY - 30 : lineY + 50;
          const yearY = i % 2 === 0 ? lineY - 48 : lineY + 32;
          const lineEndY = i % 2 === 0 ? lineY - 16 : lineY + 16;

          return (
            <g key={i}>
              <line
                x1={cx}
                y1={lineY + (i % 2 === 0 ? -14 : 14)}
                x2={cx}
                y2={lineEndY}
                stroke={isActive ? '#F59E0B' : '#D97706'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isPast ? 'none' : '3,3'}
              />
              <circle cx={cx} cy={lineY} r={dotR} fill={dotFill} stroke={dotStroke} strokeWidth={2} />
              {isActive && (
                <circle cx={cx} cy={lineY} r={14} fill="none" stroke="#F59E0B" strokeWidth={2} opacity={0.5}>
                  <animate attributeName="r" from="10" to="18" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              <text
                x={cx}
                y={yearY}
                textAnchor="middle"
                style={{
                  fontSize: isActive ? 12 : 10,
                  fontWeight: isActive ? 700 : 500,
                  fill: isActive ? '#92400E' : '#B45309',
                }}
              >
                {evt.time}
              </text>
              <text
                x={cx}
                y={labelY}
                textAnchor="middle"
                style={{
                  fontSize: isActive ? 13 : 10,
                  fontWeight: isActive ? 700 : 400,
                  fill: isActive ? '#78350F' : '#92400E',
                }}
              >
                {evt.title.length > 8 ? evt.title.slice(0, 7) + '…' : evt.title}
              </text>
            </g>
          );
        })}

        {activeIdx >= 0 && activeIdx < events.length && (
          <g>
            <rect
              x={40}
              y={svgH - 80}
              width={svgW - 80}
              height={60}
              rx={10}
              fill="white"
              stroke="#F59E0B"
              strokeWidth={1.5}
              opacity={0.95}
            />
            <text
              x={60}
              y={svgH - 52}
              style={{ fontSize: 14, fontWeight: 700, fill: '#78350F' }}
            >
              {events[activeIdx].time} · {events[activeIdx].title}
            </text>
            <text
              x={60}
              y={svgH - 32}
              style={{ fontSize: 12, fill: '#92400E' }}
            >
              {events[activeIdx].description || ''}
            </text>
          </g>
        )}
      </svg>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {events.map((evt, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              background: i === step ? '#FEF3C7' : 'transparent',
              border: i === step ? '1.5px solid #F59E0B' : '1.5px solid transparent',
              transition: 'all 0.2s',
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: i === step ? 10 : 7,
                height: i === step ? 10 : 7,
                borderRadius: '50%',
                background: i === step ? '#F59E0B' : '#D97706',
                transition: 'all 0.2s',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: i === step ? 700 : 500,
                color: i === step ? '#78350F' : '#B45309',
                whiteSpace: 'nowrap',
              }}
            >
              {evt.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
