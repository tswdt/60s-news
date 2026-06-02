import { useEffect, useRef } from 'react';
import type { TutoringResponse } from '@shared/types/tutoring';
import VisualRenderer from './visuals/VisualRenderer';

const TEACHING_MODE_LABELS: Record<string, string> = {
  socratic_visual: '🧠 引导思考',
  explanation: '📖 讲解',
  practice: '✏️ 练习',
  diagnosis: '🔍 诊断',
};

const NEXT_ACTION_LABELS: Record<string, string> = {
  wait_student_answer: '等待你的回答',
  show_hint: '给你一个提示',
  advance_step: '进入下一步',
  give_summary: '总结',
};

interface Props {
  response: TutoringResponse;
}

export default function TutoringMessage({ response }: Props) {
  const replyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (replyRef.current) {
      try {
        (window as any).renderMathInElement(replyRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ],
          throwOnError: false,
        });
      } catch {}
    }
  }, [response.reply]);

  return (
    <div className="tutoring-message">
      {response.reply && (
        <div className="tutor-reply" ref={replyRef}>
          {response.reply}
        </div>
      )}

      {response.question_to_student && (
        <div className="tutor-question">
          💭 <strong>思考：</strong>
          {response.question_to_student}
        </div>
      )}

      {response.visual && response.visual.type !== 'none' && (
        <div className="tutor-visual">
          <VisualRenderer visual={response.visual} />
        </div>
      )}

      <div className="tutor-meta">
        {response.teaching_mode && (
          <span className="meta-tag">
            {TEACHING_MODE_LABELS[response.teaching_mode] || response.teaching_mode}
          </span>
        )}
        {response.next_action && (
          <span className="meta-tag meta-action">
            {NEXT_ACTION_LABELS[response.next_action] || response.next_action}
          </span>
        )}
        {response.hint_level > 0 && (
          <span className="meta-tag meta-hint">💡 提示等级 {response.hint_level}/3</span>
        )}
        {response.misconception_check && response.misconception_check.length > 0 && (
          <span className="meta-tag meta-warning">⚠️ 检查误解</span>
        )}
      </div>
    </div>
  );
}
