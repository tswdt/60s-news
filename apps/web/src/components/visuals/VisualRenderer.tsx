import type { VisualPayload } from '@shared/types/tutoring';
import ErrorBoundary from '../ErrorBoundary';
import TriangleAngleSumParallel from './TriangleAngleSumParallel';
import RectangleGrid from './RectangleGrid';
import NumberLine from './NumberLine';
import FractionBar from './FractionBar';
import BalanceScale from './BalanceScale';
import TimelineVisual from './TimelineVisual';
import ForceDiagram from './ForceDiagram';
import CauseEffectGraph from './CauseEffectGraph';

interface Props {
  visual?: VisualPayload | null;
}

const IMPLEMENTED_TYPES = new Set([
  'triangle_angle_sum_parallel',
  'rectangle_grid',
  'number_line',
  'fraction_bar',
  'balance_scale',
  'timeline',
  'force_diagram',
  'cause_effect_graph',
]);

function VisualRendererInner({ visual }: Props) {
  if (!visual) {
    return <div style={{ padding: 20, color: '#6B7280', textAlign: 'center' }}>请先输入一个问题</div>;
  }

  if (visual.type === 'none') {
    return null;
  }

  const data = visual.data || {};
  const stepIndex = Number.isFinite(Number(visual.stepIndex)) ? Number(visual.stepIndex) : 1;

  switch (visual.type) {
    case 'triangle_angle_sum_parallel':
      return <TriangleAngleSumParallel stepIndex={stepIndex} data={data} />;

    case 'rectangle_grid':
      return <RectangleGrid stepIndex={stepIndex} rows={data.rows} cols={data.cols} unitLabel={data.unitLabel} />;

    case 'number_line':
      return <NumberLine data={data} />;

    case 'fraction_bar':
      return <FractionBar data={data} />;

    case 'balance_scale':
      return <BalanceScale data={data} />;

    case 'timeline':
      return <TimelineVisual stepIndex={Math.max(0, stepIndex - 1)} data={data} />;

    case 'force_diagram':
      return <ForceDiagram stepIndex={stepIndex} data={data} />;

    case 'cause_effect_graph':
      return <CauseEffectGraph stepIndex={stepIndex} data={data} />;

    default:
      if (!IMPLEMENTED_TYPES.has(visual.type)) {
        return (
          <div style={{
            padding: '24px 20px',
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: 10,
            textAlign: 'center',
            color: '#991B1B',
            fontSize: 14,
          }}>
            ⚠️ 当前图形组件 <strong>{visual.type}</strong> 未实现
          </div>
        );
      }
      return null;
  }
}

export default function VisualRenderer(props: Props) {
  return (
    <ErrorBoundary>
      <VisualRendererInner {...props} />
    </ErrorBoundary>
  );
}
