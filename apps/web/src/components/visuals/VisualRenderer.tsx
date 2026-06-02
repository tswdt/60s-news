import type { VisualPayload } from '@shared/types/tutoring';
import TriangleAngleSumParallel from './TriangleAngleSumParallel';
import RectangleGrid from './RectangleGrid';
import NumberLine from './NumberLine';
import FractionBar from './FractionBar';
import BalanceScale from './BalanceScale';
import TimelineVisual from './TimelineVisual';
import ForceDiagram from './ForceDiagram';
import CauseEffectGraph from './CauseEffectGraph';

interface Props {
  visual: VisualPayload;
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

export default function VisualRenderer({ visual }: Props) {
  if (!visual || visual.type === 'none') {
    return null;
  }

  const data = visual.data || {};

  switch (visual.type) {
    case 'triangle_angle_sum_parallel':
      return <TriangleAngleSumParallel stepIndex={visual.stepIndex} data={data} />;

    case 'rectangle_grid':
      return <RectangleGrid stepIndex={visual.stepIndex} rows={data.rows} cols={data.cols} unitLabel={data.unitLabel} />;

    case 'number_line':
      return <NumberLine data={data} />;

    case 'fraction_bar':
      return <FractionBar data={data} />;

    case 'balance_scale':
      return <BalanceScale data={data} />;

    case 'timeline':
      return <TimelineVisual stepIndex={visual.stepIndex} data={data} />;

    case 'force_diagram':
      return <ForceDiagram stepIndex={visual.stepIndex} data={data} />;

    case 'cause_effect_graph':
      return <CauseEffectGraph stepIndex={visual.stepIndex} data={data} />;

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
