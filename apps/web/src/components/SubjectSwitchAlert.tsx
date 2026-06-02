import type { TutoringResponse } from '@shared/types/tutoring';

interface Props {
  response: TutoringResponse;
  selectedSubject: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  math: '数学',
  chinese: '语文',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  history: '历史',
  biology: '生物',
  geography: '地理',
  politics: '政治',
  geometry: '几何',
};

export default function SubjectSwitchAlert({ response, selectedSubject }: Props) {
  if (!response.should_switch_subject) {
    return null;
  }

  const detected = response.detected_subject || '未知';
  const topic = response.detected_topic || '';
  const selected = SUBJECT_LABELS[selectedSubject] || selectedSubject;

  return (
    <div className="subject-switch-alert">
      <span className="alert-icon">🔄</span>
      <span className="alert-text">
        已识别为【{detected}
        {topic ? ` / ${topic}` : ''}】问题，当前选择为【{selected}】，已自动切换或建议切换。
      </span>
    </div>
  );
}
