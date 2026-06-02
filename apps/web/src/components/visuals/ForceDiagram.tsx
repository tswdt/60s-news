interface Props {
  stepIndex: number;
  data?: {
    objectLabel?: string;
    surfaceLabel?: string;
    showGravity?: boolean;
    showNormal?: boolean;
    showVelocity?: boolean;
    showFriction?: boolean;
    showAirResistance?: boolean;
    motionState?: 'static' | 'uniform' | 'accelerating';
  };
}

const DEFAULT_DATA: NonNullable<Props['data']> = {
  objectLabel: '冰壶',
  surfaceLabel: '光滑冰面',
  showGravity: true,
  showNormal: true,
  showVelocity: true,
  showFriction: false,
  showAirResistance: false,
  motionState: 'uniform',
};

const STEP_REPLIES: Record<number, { title: string; desc: string }> = {
  0: {
    title: '冰壶在光滑冰面上运动',
    desc: '假设冰面完全光滑，没有摩擦力',
  },
  1: {
    title: '竖直方向受力平衡',
    desc: '重力 G 向下，支持力 N 向上，G = N',
  },
  2: {
    title: '水平方向合力为 0',
    desc: '没有摩擦力，没有空气阻力，水平方向不受力',
  },
  3: {
    title: '冰壶保持匀速直线运动',
    desc: '不受外力或合力为 0 时，物体保持静止或匀速直线运动',
  },
  4: {
    title: '牛顿第一定律',
    desc: '一切物体在没有受到外力作用时，总保持静止或匀速直线运动状态',
  },
};

export default function ForceDiagram({ stepIndex, data }: Props) {
  const d = { ...DEFAULT_DATA, ...data };
  const step = Math.max(0, Math.min(4, stepIndex ?? 0));
  const info = STEP_REPLIES[step] || STEP_REPLIES[0];

  const svgW = 640;
  const svgH = 380;
  const cx = svgW / 2;
  const objY = 220;
  const objW = 80;
  const objH = 50;
  const surfaceY = objY + objH / 2;
  const arrowLen = 70;

  const showG = step >= 1 && d.showGravity !== false;
  const showN = step >= 1 && d.showNormal !== false;
  const showV = d.showVelocity !== false && step !== 4;
  const showNoF = step === 2;
  const showUniform = step === 3;
  const showConclusion = step === 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{
          background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
          borderRadius: 14,
          maxWidth: '100%',
          height: 'auto',
          boxShadow: '0 2px 12px rgba(14,165,233,0.08)',
        }}
      >
        <defs>
          <marker id="arrowRed" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#DC2626" />
          </marker>
          <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#2563EB" />
          </marker>
          <marker id="arrowGreen" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#16A34A" />
          </marker>
          <marker id="arrowGray" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" />
          </marker>
          <marker id="arrowOrange" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#EA580C" />
          </marker>
        </defs>

        <line
          x1={60}
          y1={surfaceY}
          x2={svgW - 60}
          y2={surfaceY}
          stroke="#94A3B8"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {Array.from({ length: 20 }).map((_, i) => {
          const lx = 80 + i * 28;
          return (
            <line
              key={i}
              x1={lx}
              y1={surfaceY}
              x2={lx - 10}
              y2={surfaceY + 10}
              stroke="#CBD5E1"
              strokeWidth={1}
            />
          );
        })}

        <text
          x={svgW - 70}
          y={surfaceY + 24}
          textAnchor="end"
          style={{ fontSize: 11, fill: '#94A3B8', fontStyle: 'italic' }}
        >
          {d.surfaceLabel}
        </text>

        <rect
          x={cx - objW / 2}
          y={objY - objH / 2}
          width={objW}
          height={objH}
          rx={8}
          fill="#E0F2FE"
          stroke="#0EA5E9"
          strokeWidth={2}
        />
        <text
          x={cx}
          y={objY + 5}
          textAnchor="middle"
          style={{ fontSize: 14, fontWeight: 700, fill: '#0369A1' }}
        >
          {d.objectLabel}
        </text>

        {showV && (
          <g>
            <line
              x1={cx + objW / 2 + 10}
              y1={objY}
              x2={cx + objW / 2 + 10 + arrowLen}
              y2={objY}
              stroke="#16A34A"
              strokeWidth={3}
              markerEnd="url(#arrowGreen)"
            />
            <text
              x={cx + objW / 2 + 10 + arrowLen / 2}
              y={objY - 10}
              textAnchor="middle"
              style={{ fontSize: 16, fontWeight: 700, fill: '#16A34A' }}
            >
              v
            </text>
          </g>
        )}

        {showG && (
          <g>
            <line
              x1={cx - 15}
              y1={objY + objH / 2 + 5}
              x2={cx - 15}
              y2={objY + objH / 2 + 5 + arrowLen}
              stroke="#DC2626"
              strokeWidth={3}
              markerEnd="url(#arrowRed)"
            />
            <text
              x={cx - 15}
              y={objY + objH / 2 + 5 + arrowLen + 18}
              textAnchor="middle"
              style={{ fontSize: 15, fontWeight: 700, fill: '#DC2626' }}
            >
              G
            </text>
          </g>
        )}

        {showN && (
          <g>
            <line
              x1={cx + 15}
              y1={objY - objH / 2 - 5}
              x2={cx + 15}
              y2={objY - objH / 2 - 5 - arrowLen}
              stroke="#2563EB"
              strokeWidth={3}
              markerEnd="url(#arrowBlue)"
            />
            <text
              x={cx + 15}
              y={objY - objH / 2 - 5 - arrowLen - 8}
              textAnchor="middle"
              style={{ fontSize: 15, fontWeight: 700, fill: '#2563EB' }}
            >
              N
            </text>
          </g>
        )}

        {showNoF && (
          <g>
            <line
              x1={cx - objW / 2 - 10}
              y1={objY}
              x2={cx - objW / 2 - 10 - arrowLen * 0.6}
              y2={objY}
              stroke="#9CA3AF"
              strokeWidth={2}
              strokeDasharray="6,4"
              markerEnd="url(#arrowGray)"
            />
            <text
              x={cx - objW / 2 - 10 - arrowLen * 0.3}
              y={objY - 12}
              textAnchor="middle"
              style={{ fontSize: 12, fill: '#9CA3AF' }}
            >
              f = 0
            </text>

            <line
              x1={cx}
              y1={objY - objH / 2 - 5 - arrowLen - 30}
              x2={cx + arrowLen * 0.5}
              y2={objY - objH / 2 - 5 - arrowLen - 30}
              stroke="#9CA3AF"
              strokeWidth={2}
              strokeDasharray="6,4"
              markerEnd="url(#arrowGray)"
            />
            <text
              x={cx + arrowLen * 0.25}
              y={objY - objH / 2 - 5 - arrowLen - 38}
              textAnchor="middle"
              style={{ fontSize: 12, fill: '#9CA3AF' }}
            >
              空气阻力 = 0
            </text>
          </g>
        )}

        {showUniform && (
          <g>
            <line
              x1={cx + objW / 2 + 10}
              y1={objY}
              x2={cx + objW / 2 + 10 + arrowLen}
              y2={objY}
              stroke="#16A34A"
              strokeWidth={3}
              markerEnd="url(#arrowGreen)"
            />
            <text
              x={cx + objW / 2 + 10 + arrowLen / 2}
              y={objY - 10}
              textAnchor="middle"
              style={{ fontSize: 16, fontWeight: 700, fill: '#16A34A' }}
            >
              v
            </text>

            {Array.from({ length: 4 }).map((_, i) => {
              const tx = cx + objW / 2 + 20 + i * 30;
              return (
                <line
                  key={i}
                  x1={tx}
                  y1={objY - 3}
                  x2={tx + 12}
                  y2={objY - 3}
                  stroke="#16A34A"
                  strokeWidth={1.5}
                  opacity={0.4 + i * 0.1}
                />
              );
            })}

            <text
              x={cx + objW / 2 + 10 + arrowLen / 2}
              y={objY + 20}
              textAnchor="middle"
              style={{ fontSize: 11, fill: '#16A34A' }}
            >
              匀速
            </text>
          </g>
        )}

        {showConclusion && (
          <g>
            <rect
              x={60}
              y={30}
              width={svgW - 120}
              height={70}
              rx={12}
              fill="white"
              stroke="#0EA5E9"
              strokeWidth={2}
              opacity={0.95}
            />
            <text
              x={svgW / 2}
              y={58}
              textAnchor="middle"
              style={{ fontSize: 16, fontWeight: 700, fill: '#0369A1' }}
            >
              牛顿第一定律
            </text>
            <text
              x={svgW / 2}
              y={82}
              textAnchor="middle"
              style={{ fontSize: 12, fill: '#0C4A6E' }}
            >
              一切物体在没有受到外力作用时，总保持静止或匀速直线运动状态
            </text>
          </g>
        )}

        <rect
          x={40}
          y={svgH - 80}
          width={svgW - 80}
          height={60}
          rx={10}
          fill="white"
          stroke="#0EA5E9"
          strokeWidth={1.5}
          opacity={0.95}
        />
        <text
          x={60}
          y={svgH - 52}
          style={{ fontSize: 14, fontWeight: 700, fill: '#0369A1' }}
        >
          第 {step + 1} 步：{info.title}
        </text>
        <text
          x={60}
          y={svgH - 32}
          style={{ fontSize: 12, fill: '#0C4A6E' }}
        >
          {info.desc}
        </text>
      </svg>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              background: i === step ? '#E0F2FE' : 'transparent',
              border: i === step ? '1.5px solid #0EA5E9' : '1.5px solid transparent',
              transition: 'all 0.2s',
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: i === step ? 10 : 7,
                height: i === step ? 10 : 7,
                borderRadius: '50%',
                background: i === step ? '#0EA5E9' : '#94A3B8',
                transition: 'all 0.2s',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: i === step ? 700 : 500,
                color: i === step ? '#0369A1' : '#64748B',
                whiteSpace: 'nowrap',
              }}
            >
              {STEP_REPLIES[i]?.title || `步骤${i + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
