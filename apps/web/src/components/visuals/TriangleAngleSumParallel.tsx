interface Props {
  stepIndex: number;
  data?: Record<string, any>;
}

const W = 640;
const H = 500;

const A = { x: 320, y: 100 };
const B = { x: 100, y: 400 };
const C = { x: 540, y: 400 };

const PARALLEL_EXT = 120;
const PARALLEL_LEFT = { x: A.x - (C.x - B.x) - PARALLEL_EXT, y: A.y };
const PARALLEL_RIGHT = { x: A.x + (C.x - B.x) + PARALLEL_EXT, y: A.y };

const ANGLE_R = 36;
const LABEL_R = 56;

function angleOf(from: { x: number; y: number }, to: { x: number; y: number }) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function polarPoint(center: { x: number; y: number }, r: number, angle: number) {
  return { x: center.x + r * Math.cos(angle), y: center.y + r * Math.sin(angle) };
}

function arcPath(
  center: { x: number; y: number },
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const s = polarPoint(center, r, startAngle);
  const e = polarPoint(center, r, endAngle);
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += Math.PI * 2;
  const largeArc = sweep > Math.PI ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

function sectorPath(
  center: { x: number; y: number },
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const s = polarPoint(center, r, startAngle);
  const e = polarPoint(center, r, endAngle);
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += Math.PI * 2;
  const largeArc = sweep > Math.PI ? 1 : 0;
  return `M ${center.x} ${center.y} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}

const angleA_B = angleOf(A, B);
const angleA_C = angleOf(A, C);
const angleA_PLeft = Math.PI;
const angleA_PRight = 0;

const angleB_A = angleOf(B, A);
const angleB_C = angleOf(B, C);

const angleC_A = angleOf(C, A);
const angleC_B = angleOf(C, B);

const COLOR_A = '#EF4444';
const COLOR_B = '#F59E0B';
const COLOR_C = '#10B981';
const COLOR_PARALLEL = '#8B5CF6';
const COLOR_LINE = '#334155';
const COLOR_FILL = 'rgba(99, 102, 241, 0.06)';
const COLOR_STRAIGHT = '#6366F1';

function AngleArc({
  center,
  from,
  to,
  color,
  label,
  r = ANGLE_R,
  filled = true,
  bold = false,
  largeR,
}: {
  center: { x: number; y: number };
  from: number;
  to: number;
  color: string;
  label?: string;
  r?: number;
  filled?: boolean;
  bold?: boolean;
  largeR?: number;
}) {
  const mid = (from + to) / 2;
  const labelR = largeR || LABEL_R;
  const labelPos = polarPoint(center, labelR, mid);
  return (
    <g>
      {filled && (
        <path d={sectorPath(center, r, from, to)} fill={color} opacity={0.35} />
      )}
      <path
        d={arcPath(center, r, from, to)}
        fill="none"
        stroke={color}
        strokeWidth={bold ? 4 : 2.5}
      />
      {label && (
        <text
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={bold ? 16 : 14}
          fontWeight={bold ? 800 : 600}
          fontFamily="Inter, system-ui, sans-serif"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function StepNote({ y, children, highlight = false }: { y: number; children: React.ReactNode; highlight?: boolean }) {
  return (
    <g>
      <rect
        x={50}
        y={y - 20}
        width={W - 100}
        height={40}
        rx={10}
        fill={highlight ? '#EEF2FF' : '#F8FAFC'}
        stroke={highlight ? '#6366F1' : '#E2E8F0'}
        strokeWidth={highlight ? 1.5 : 1}
      />
      <text
        x={W / 2}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={highlight ? '#4338CA' : '#475569'}
        fontSize={14}
        fontWeight={600}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {children}
      </text>
    </g>
  );
}

function TriangleBase() {
  return (
    <g>
      <polygon
        points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
        fill={COLOR_FILL}
      />
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={COLOR_LINE} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={B.x} y1={B.y} x2={C.x} y2={C.y} stroke={COLOR_LINE} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={C.x} y1={C.y} x2={A.x} y2={A.y} stroke={COLOR_LINE} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

function VertexLabels() {
  return (
    <g>
      <text x={A.x} y={A.y - 22} textAnchor="middle" dominantBaseline="central" fill="#1E293B" fontSize={18} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">A</text>
      <text x={B.x - 24} y={B.y + 18} textAnchor="middle" dominantBaseline="central" fill="#1E293B" fontSize={18} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">B</text>
      <text x={C.x + 24} y={C.y + 18} textAnchor="middle" dominantBaseline="central" fill="#1E293B" fontSize={18} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">C</text>
    </g>
  );
}

function ParallelLine() {
  return (
    <g>
      <line
        x1={PARALLEL_LEFT.x}
        y1={PARALLEL_LEFT.y}
        x2={PARALLEL_RIGHT.x}
        y2={PARALLEL_RIGHT.y}
        stroke={COLOR_PARALLEL}
        strokeWidth={2.5}
        strokeDasharray="12 6"
      />
      <text
        x={PARALLEL_RIGHT.x - 40}
        y={PARALLEL_RIGHT.y - 14}
        textAnchor="middle"
        dominantBaseline="central"
        fill={COLOR_PARALLEL}
        fontSize={14}
        fontWeight={700}
        fontFamily="Inter, system-ui, sans-serif"
      >
        ∥ BC
      </text>
      {[
        A.x - (C.x - B.x) / 2,
        A.x + (C.x - B.x) / 2,
      ].map((cx, i) => (
        <g key={i} transform={`translate(${cx}, ${A.y})`}>
          <polyline points="-6,-4 0,0 -6,4" fill="none" stroke={COLOR_PARALLEL} strokeWidth={2} />
        </g>
      ))}
    </g>
  );
}

function Step0() {
  return (
    <g>
      <TriangleBase />
      <VertexLabels />
      <AngleArc center={A} from={angleA_B} to={angleA_C} color={COLOR_A} label="∠A" r={28} filled={false} />
      <AngleArc center={B} from={angleB_A} to={angleB_C} color={COLOR_B} label="∠B" r={28} filled={false} />
      <AngleArc center={C} from={angleC_B} to={angleC_A} color={COLOR_C} label="∠C" r={28} filled={false} />
      <StepNote y={H - 30}>这是三角形 ABC，它有三个内角</StepNote>
    </g>
  );
}

function Step1() {
  return (
    <g>
      <TriangleBase />
      <ParallelLine />
      <VertexLabels />
      <circle cx={A.x} cy={A.y} r={4} fill={COLOR_PARALLEL} />
      <StepNote y={H - 30} highlight>过 A 点画一条与 BC 平行的直线</StepNote>
    </g>
  );
}

function Step2() {
  return (
    <g>
      <TriangleBase />
      <ParallelLine />
      <VertexLabels />

      <AngleArc center={B} from={angleB_A} to={angleB_C} color={COLOR_B} label="∠B" bold />

      <AngleArc center={A} from={angleA_PLeft} to={angleA_B} color={COLOR_B} label="∠B'" bold />

      <line
        x1={B.x} y1={B.y}
        x2={polarPoint(B, 80, (angleB_A + angleB_C) / 2).x}
        y2={polarPoint(B, 80, (angleB_A + angleB_C) / 2).y}
        stroke={COLOR_B}
        strokeWidth={1.5}
        strokeDasharray="6 4"
        opacity={0.6}
      />

      <StepNote y={H - 30} highlight>因为平行线，∠B 可以搬到 A 点左侧（内错角相等）</StepNote>
    </g>
  );
}

function Step3() {
  return (
    <g>
      <TriangleBase />
      <ParallelLine />
      <VertexLabels />

      <AngleArc center={B} from={angleB_A} to={angleB_C} color={COLOR_B} label="∠B" />
      <AngleArc center={A} from={angleA_PLeft} to={angleA_B} color={COLOR_B} label="∠B'" />

      <AngleArc center={C} from={angleC_B} to={angleC_A} color={COLOR_C} label="∠C" bold />
      <AngleArc center={A} from={angleA_C} to={angleA_PRight} color={COLOR_C} label="∠C'" bold />

      <line
        x1={C.x} y1={C.y}
        x2={polarPoint(C, 80, (angleC_B + angleC_A) / 2).x}
        y2={polarPoint(C, 80, (angleC_B + angleC_A) / 2).y}
        stroke={COLOR_C}
        strokeWidth={1.5}
        strokeDasharray="6 4"
        opacity={0.6}
      />

      <StepNote y={H - 30} highlight>∠C 也可以搬到 A 点右侧（内错角相等）</StepNote>
    </g>
  );
}

function Step4() {
  return (
    <g>
      <TriangleBase />
      <ParallelLine />
      <VertexLabels />

      <AngleArc center={A} from={angleA_PLeft} to={angleA_B} color={COLOR_B} label="∠B'" bold />
      <AngleArc center={A} from={angleA_B} to={angleA_C} color={COLOR_A} label="∠A" bold />
      <AngleArc center={A} from={angleA_C} to={angleA_PRight} color={COLOR_C} label="∠C'" bold />

      <line
        x1={PARALLEL_LEFT.x + 30}
        y1={A.y}
        x2={PARALLEL_RIGHT.x - 30}
        y2={A.y}
        stroke={COLOR_STRAIGHT}
        strokeWidth={4}
        opacity={0.5}
      />

      <text
        x={PARALLEL_LEFT.x + 50}
        y={A.y - 16}
        textAnchor="middle"
        dominantBaseline="central"
        fill={COLOR_STRAIGHT}
        fontSize={13}
        fontWeight={600}
        fontFamily="Inter, system-ui, sans-serif"
      >
        平角 180°
      </text>

      <StepNote y={H - 30} highlight>∠B' + ∠A + ∠C' 拼在一起刚好是一条直线（平角）</StepNote>
    </g>
  );
}

function Step5() {
  return (
    <g>
      <TriangleBase />
      <ParallelLine />
      <VertexLabels />

      <AngleArc center={A} from={angleA_PLeft} to={angleA_B} color={COLOR_B} label="∠B'" bold />
      <AngleArc center={A} from={angleA_B} to={angleA_C} color={COLOR_A} label="∠A" bold />
      <AngleArc center={A} from={angleA_C} to={angleA_PRight} color={COLOR_C} label="∠C'" bold />

      <line
        x1={PARALLEL_LEFT.x + 30}
        y1={A.y}
        x2={PARALLEL_RIGHT.x - 30}
        y2={A.y}
        stroke={COLOR_STRAIGHT}
        strokeWidth={4}
        opacity={0.5}
      />

      <rect x={90} y={H - 80} width={W - 180} height={64} rx={12} fill="#EEF2FF" stroke="#6366F1" strokeWidth={2} />
      <text x={W / 2} y={H - 55} textAnchor="middle" dominantBaseline="central" fill="#4338CA" fontSize={20} fontWeight={800} fontFamily="Inter, system-ui, sans-serif">
        ∠A + ∠B + ∠C = 180°
      </text>
      <text x={W / 2} y={H - 30} textAnchor="middle" dominantBaseline="central" fill="#64748B" fontSize={13} fontWeight={500} fontFamily="Inter, system-ui, sans-serif">
        三个内角拼成一个平角，所以三角形内角和是 180°
      </text>
    </g>
  );
}

const STEPS = [Step0, Step1, Step2, Step3, Step4, Step5];
const STEP_LABELS = [
  '三角形 ABC',
  '画平行线',
  '∠B 搬到左侧',
  '∠C 搬到右侧',
  '拼成平角',
  '内角和 = 180°',
];

export default function TriangleAngleSumParallel({ stepIndex, data }: Props) {
  const safeStep = Math.max(0, Math.min(5, stepIndex ?? data?.stepIndex ?? 0));
  const StepComponent = STEPS[safeStep];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          background: 'linear-gradient(135deg, #FAFBFF 0%, #F0F1FF 100%)',
          borderRadius: 14,
          maxWidth: '100%',
          height: 'auto',
          boxShadow: '0 2px 12px rgba(99,102,241,0.08)',
        }}
      >
        <StepComponent />
      </svg>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              background: i === safeStep ? '#EEF2FF' : 'transparent',
              border: i === safeStep ? '1.5px solid #6366F1' : '1.5px solid transparent',
              transition: 'all 0.2s',
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: i === safeStep ? 10 : 7,
                height: i === safeStep ? 10 : 7,
                borderRadius: '50%',
                background: i === safeStep ? '#6366F1' : '#CBD5E1',
                transition: 'all 0.2s',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: i === safeStep ? 700 : 500,
                color: i === safeStep ? '#4338CA' : '#94A3B8',
                whiteSpace: 'nowrap',
              }}
            >
              {STEP_LABELS[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
