export const GradeLabels = {
  '1': '小学一年级', '2': '小学二年级', '3': '小学三年级',
  '4': '小学四年级', '5': '小学五年级', '6': '小学六年级',
  '7': '初一', '8': '初二', '9': '初三',
  '10': '高一', '11': '高二', '12': '高三',
} as const;

export type Grade = keyof typeof GradeLabels;

export const SubjectLabels = {
  math: '数学', chinese: '语文', english: '英语',
  physics: '物理', chemistry: '化学', history: '历史',
  biology: '生物', geography: '地理', politics: '政治',
  geometry: '几何',
} as const;

export type Subject = keyof typeof SubjectLabels;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TutorRequest {
  messages: ChatMessage[];
  grade: Grade;
  subject: Subject;
  model: 'deepseek' | 'bailian';
}

export type ModelProvider = 'deepseek' | 'qwen' | 'qwen-vl';

export interface TutorCloudRequest {
  userMessage: string;
  selectedSubject: Subject;
  selectedGrade: Grade;
  conversationHistory: ChatMessage[];
  currentStep: number;
  modelProvider: ModelProvider;
  sessionState?: TutoringSession;
}

export interface TutoringSession {
  sessionId: string;
  topic: string;
  subject: string;
  grade: string;
  visualType: string;
  currentStep: number;
  maxStep: number;
  lastQuestion: string;
  expectedStudentAnswer: string;
  studentAnswers: string[];
  misconceptionFlags: string[];
  hintLevel: number;
}

export const VISUAL_MAX_STEPS: Record<string, number> = {
  triangle_angle_sum_parallel: 5,
  rectangle_grid: 4,
  number_line: 4,
  fraction_bar: 4,
  balance_scale: 4,
  geometry_canvas: 4,
  timeline: 4,
  cause_effect_graph: 5,
  chem_particle: 4,
  force_diagram: 4,
  none: 1,
};

export function createTutoringSession(
  subject: string,
  grade: string,
  topic: string,
  visualType: string,
): TutoringSession {
  return {
    sessionId: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
    topic,
    subject,
    grade,
    visualType,
    currentStep: 1,
    maxStep: VISUAL_MAX_STEPS[visualType] || 4,
    lastQuestion: '',
    expectedStudentAnswer: '',
    studentAnswers: [],
    misconceptionFlags: [],
    hintLevel: 0,
  };
}

export interface TutorCloudResult {
  success: boolean;
  parsed: TutoringResponse;
  error?: string;
}

export interface DetectSubjectRequest {
  text: string;
}

export interface DetectSubjectResult {
  subject: Subject;
  grade: Grade;
  knowledgePoints: string[];
  confidence: number;
}

export const SubjectIcons: Record<Subject, string> = {
  math: '📐', chinese: '📝', english: '🔤',
  physics: '⚡', chemistry: '🧪', history: '📜',
  biology: '🧬', geography: '🌍', politics: '🏛️',
  geometry: '📏',
};

export const ModelConfig = {
  deepseek: { name: 'DeepSeek', desc: '深度推理，适合数学和逻辑' },
  bailian: { name: '通义千问', desc: '知识面广，适合文科和综合' },
} as const;

export type ModelId = keyof typeof ModelConfig;

// ========== AI 教学返回协议 ==========

export type VisualType =
  | 'triangle_angle_sum_parallel'
  | 'rectangle_grid'
  | 'number_line'
  | 'fraction_bar'
  | 'balance_scale'
  | 'geometry_canvas'
  | 'timeline'
  | 'cause_effect_graph'
  | 'chem_particle'
  | 'force_diagram'
  | 'none';

export type TeachingMode = 'socratic_visual' | 'explanation' | 'practice' | 'diagnosis';

export type NextAction = 'wait_student_answer' | 'show_hint' | 'advance_step' | 'give_summary';

export interface VisualPayload {
  type: VisualType;
  stepIndex: number;
  data?: Record<string, any>;
}

export interface TutoringResponse {
  detected_subject: string;
  detected_topic: string;
  detected_grade: string;
  selected_subject?: string;
  should_switch_subject?: boolean;

  teaching_mode: TeachingMode;
  current_step: number;

  reply: string;
  question_to_student: string;

  visual: VisualPayload;

  expected_student_answer?: string;
  misconception_check?: string[];
  hint_level: number;

  next_action: NextAction;
}

export function createFallbackResponse(reply: string): TutoringResponse {
  return {
    detected_subject: 'math',
    detected_topic: '未知',
    detected_grade: '7',
    teaching_mode: 'explanation',
    current_step: 1,
    reply,
    question_to_student: '你还有什么不明白的地方吗？',
    visual: { type: 'none', stepIndex: 0 },
    hint_level: 0,
    next_action: 'wait_student_answer',
  };
}

function truncateByCharLen(str: string, maxLen: number): string {
  if (!str) return str;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    count += str.charCodeAt(i) > 127 ? 1 : 0.5;
    if (count > maxLen) return str.slice(0, i) + '…';
  }
  return str;
}

function extractFirstQuestion(str: string): string {
  if (!str) return str;
  const qIdx = str.indexOf('？');
  const qIdx2 = str.indexOf('?');
  let firstQ = -1;
  if (qIdx >= 0 && qIdx2 >= 0) firstQ = Math.min(qIdx, qIdx2);
  else if (qIdx >= 0) firstQ = qIdx;
  else if (qIdx2 >= 0) firstQ = qIdx2;
  if (firstQ >= 0) {
    let result = str.slice(0, firstQ + 1);
    const sentenceEnd = result.search(/[。！；]([^。！；]*)$/);
    if (sentenceEnd >= 0) {
      result = result.slice(sentenceEnd + 1);
    }
    return result.trim();
  }
  return str;
}

export function parseTutoringResponse(raw: string): TutoringResponse {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return createFallbackResponse(raw.slice(0, 500));
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    const validVisualTypes: VisualType[] = [
      'triangle_angle_sum_parallel', 'rectangle_grid', 'number_line',
      'fraction_bar', 'balance_scale', 'geometry_canvas',
      'timeline', 'cause_effect_graph', 'chem_particle',
      'force_diagram', 'none',
    ];

    const validTeachingModes: TeachingMode[] = [
      'socratic_visual', 'explanation', 'practice', 'diagnosis',
    ];

    const validNextActions: NextAction[] = [
      'wait_student_answer', 'show_hint', 'advance_step', 'give_summary',
    ];

    const visualType = validVisualTypes.includes(parsed.visual?.type)
      ? parsed.visual.type
      : 'none';

    const teachingMode = validTeachingModes.includes(parsed.teaching_mode)
      ? parsed.teaching_mode
      : 'explanation';

    const nextAction = validNextActions.includes(parsed.next_action)
      ? parsed.next_action
      : 'wait_student_answer';

    let reply = String(parsed.reply || '');
    let question = String(parsed.question_to_student || '');

    reply = truncateByCharLen(reply, 80);
    question = extractFirstQuestion(question);
    question = truncateByCharLen(question, 40);

    return {
      detected_subject: String(parsed.detected_subject || 'math'),
      detected_topic: String(parsed.detected_topic || '未知'),
      detected_grade: String(parsed.detected_grade || '7'),
      selected_subject: parsed.selected_subject ? String(parsed.selected_subject) : undefined,
      should_switch_subject: Boolean(parsed.should_switch_subject),

      teaching_mode: teachingMode,
      current_step: Number(parsed.current_step) || 1,

      reply,
      question_to_student: question,

      visual: {
        type: visualType,
        stepIndex: Number(parsed.visual?.stepIndex) || 0,
        data: parsed.visual?.data || undefined,
      },

      expected_student_answer: parsed.expected_student_answer
        ? String(parsed.expected_student_answer)
        : undefined,
      misconception_check: Array.isArray(parsed.misconception_check)
        ? parsed.misconception_check.map(String)
        : undefined,
      hint_level: Math.max(0, Math.min(3, Number(parsed.hint_level) || 0)),

      next_action: nextAction,
    };
  } catch {
    return createFallbackResponse(raw.slice(0, 500));
  }
}
