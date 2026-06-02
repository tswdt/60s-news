import { useState, useRef, useEffect, useCallback } from 'react';
import type { TutoringResponse, Subject, Grade, ModelProvider, TutoringSession, VisualType } from '@shared/types/tutoring';
import { parseTutoringResponse, createTutoringSession, SubjectLabels, GradeLabels, VISUAL_MAX_STEPS } from '@shared/types/tutoring';
import VisualRenderer from './components/visuals/VisualRenderer';
import './styles/style.css';

const SUBJECTS: { key: Subject; icon: string; name: string }[] = [
  { key: 'math', icon: '📐', name: '数学' },
  { key: 'chinese', icon: '📝', name: '语文' },
  { key: 'english', icon: '🔤', name: '英语' },
  { key: 'physics', icon: '⚡', name: '物理' },
  { key: 'chemistry', icon: '🧪', name: '化学' },
  { key: 'history', icon: '📜', name: '历史' },
  { key: 'biology', icon: '🧬', name: '生物' },
  { key: 'geography', icon: '🌍', name: '地理' },
  { key: 'geometry', icon: '📏', name: '几何' },
];

const GRADES: { label: string; items: { key: Grade; name: string }[] }[] = [
  {
    label: '小学',
    items: [
      { key: '1', name: '一' },
      { key: '2', name: '二' },
      { key: '3', name: '三' },
      { key: '4', name: '四' },
      { key: '5', name: '五' },
      { key: '6', name: '六' },
    ],
  },
  {
    label: '初中',
    items: [
      { key: '7', name: '初一' },
      { key: '8', name: '初二' },
      { key: '9', name: '初三' },
    ],
  },
  {
    label: '高中',
    items: [
      { key: '10', name: '高一' },
      { key: '11', name: '高二' },
      { key: '12', name: '高三' },
    ],
  },
];

const QUICK_QUESTIONS = [
  { q: '为什么负负得正？', label: '为什么负负得正？' },
  { q: '三角形内角和为什么是180度？', label: '三角形内角和' },
  { q: '什么是光合作用？', label: '光合作用' },
  { q: '唐朝为什么那么强大？', label: '唐朝为什么强大' },
  { q: '牛顿第一定律是什么意思？', label: '牛顿第一定律' },
  { q: '三国是从什么时候开始的？', label: '三国时期' },
];

const MODELS: { key: ModelProvider; name: string }[] = [
  { key: 'deepseek', name: 'DeepSeek' },
  { key: 'qwen', name: '通义千问' },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const SUBJECT_LABEL_TO_KEY: Record<string, Subject> = Object.fromEntries(
  Object.entries(SubjectLabels).map(([k, v]) => [v, k as Subject])
) as Record<string, Subject>;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  loading?: boolean;
  isFallback?: boolean;
  response?: TutoringResponse;
}

type UserIntent = 'new_question' | 'student_answer' | 'clarification' | 'unknown';

interface UserInputClassification {
  intent: UserIntent;
  detectedSubject?: string;
  detectedTopic?: string;
  detectedVisualType?: VisualType;
  confidence: number;
  reason: string;
}

const TOPIC_ROUTING: {
  patterns: string[];
  subject: string;
  subjectKey: Subject;
  topic: string;
  visualType: VisualType;
}[] = [
  {
    patterns: ['唐朝为什么那么强大', '唐朝强盛', '盛唐'],
    subject: '历史', subjectKey: 'history', topic: '唐朝强盛原因', visualType: 'cause_effect_graph',
  },
  {
    patterns: ['三国从什么时候开始', '三国什么时候开始', '三国时期', '三国是从什么时候', '三国是从', '赤壁', '曹操', '刘备', '孙权'],
    subject: '历史', subjectKey: 'history', topic: '三国时期', visualType: 'timeline',
  },
  {
    patterns: ['牛顿第一定律', '惯性定律', '牛顿第一'],
    subject: '物理', subjectKey: 'physics', topic: '牛顿第一定律', visualType: 'force_diagram',
  },
  {
    patterns: ['三角形内角和', '三角形内角'],
    subject: '数学', subjectKey: 'geometry', topic: '三角形内角和', visualType: 'triangle_angle_sum_parallel',
  },
  {
    patterns: ['长方形面积'],
    subject: '数学', subjectKey: 'math', topic: '长方形面积', visualType: 'rectangle_grid',
  },
  {
    patterns: ['光合作用', '叶绿体'],
    subject: '生物', subjectKey: 'biology', topic: '光合作用', visualType: 'none',
  },
  {
    patterns: ['负负得正', '负数乘法'],
    subject: '数学', subjectKey: 'math', topic: '负负得正', visualType: 'none',
  },
  {
    patterns: ['水分子', 'H2O'],
    subject: '化学', subjectKey: 'chemistry', topic: '水分子结构', visualType: 'none',
  },
  {
    patterns: ['二次函数', '抛物线'],
    subject: '数学', subjectKey: 'math', topic: '二次函数', visualType: 'none',
  },
];

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  '物理': ['牛顿', '力', '运动', '光', '电', '压强', '浮力', '惯性', '摩擦', '速度', '加速度', '重力', '能量', '功', '功率'],
  '历史': ['唐朝', '三国', '秦朝', '汉朝', '宋朝', '明朝', '清朝', '朝代', '皇帝', '起义', '变法', '战争', '盛世'],
  '数学': ['三角形', '面积', '方程', '函数', '几何', '分数', '小数', '乘法', '除法', '负数', '坐标'],
  '几何': ['三角形', '圆', '角', '平行', '垂直', '证明', '内角'],
  '生物': ['光合作用', '细胞', '遗传', 'DNA', '基因', '进化', '生态', '呼吸'],
  '化学': ['分子', '原子', '化学反应', '酸碱盐', '元素', '周期表', '氧化', '还原'],
};

function routeTopic(text: string): { subject: string; subjectKey: Subject; topic: string; visualType: VisualType } | null {
  for (const route of TOPIC_ROUTING) {
    for (const pattern of route.patterns) {
      if (text.includes(pattern)) {
        return { subject: route.subject, subjectKey: route.subjectKey, topic: route.topic, visualType: route.visualType };
      }
    }
  }
  return null;
}

function detectSubjectFromKeywords(text: string): { subject: string; subjectKey: Subject } | null {
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        const key = SUBJECT_LABEL_TO_KEY[subject] as Subject | undefined;
        if (key) return { subject, subjectKey: key };
      }
    }
  }
  return null;
}

function classifyUserInput(
  text: string,
  currentSessionState: TutoringSession | null,
): UserInputClassification {
  const t = text.trim();
  if (!t) return { intent: 'unknown', confidence: 0.9, reason: '空输入' };

  const routed = routeTopic(t);

  if (currentSessionState && currentSessionState.sessionId && currentSessionState.topic && currentSessionState.topic !== '通用问题') {
    if (routed) {
      const sameSubject = routed.subject === currentSessionState.subject;
      const sameTopic = routed.topic === currentSessionState.topic;
      if (!sameTopic) {
        return {
          intent: 'new_question',
          detectedSubject: routed.subject,
          detectedTopic: routed.topic,
          detectedVisualType: routed.visualType,
          confidence: 0.95,
          reason: `检测到新知识点"${routed.topic}"，与当前"${currentSessionState.topic}"不同`,
        };
      }
      if (!sameSubject) {
        return {
          intent: 'new_question',
          detectedSubject: routed.subject,
          detectedTopic: routed.topic,
          detectedVisualType: routed.visualType,
          confidence: 0.95,
          reason: `检测到学科切换：${currentSessionState.subject} → ${routed.subject}`,
        };
      }
    }

    const detectedSubj = detectSubjectFromKeywords(t);
    if (detectedSubj && detectedSubj.subject !== currentSessionState.subject) {
      return {
        intent: 'new_question',
        detectedSubject: detectedSubj.subject,
        detectedTopic: routed?.topic || detectedSubj.subject + '问题',
        detectedVisualType: routed?.visualType || 'none',
        confidence: 0.85,
        reason: `输入包含${detectedSubj.subject}关键词，与当前${currentSessionState.subject}不一致`,
      };
    }
  }

  const questionPatterns = ['为什么', '怎么', '什么是', '是什么', '什么时候', '如何', '原因', '意思', '怎么算', '怎么证明', '吗', '？', '?'];
  for (const p of questionPatterns) {
    if (t.includes(p)) {
      if (routed) {
        return {
          intent: 'new_question',
          detectedSubject: routed.subject,
          detectedTopic: routed.topic,
          detectedVisualType: routed.visualType,
          confidence: 0.9,
          reason: `包含提问词"${p}"，且匹配已知知识点"${routed.topic}"`,
        };
      }
      const detectedSubj = detectSubjectFromKeywords(t);
      if (detectedSubj) {
        return {
          intent: 'new_question',
          detectedSubject: detectedSubj.subject,
          detectedTopic: t.slice(0, 20),
          detectedVisualType: 'none',
          confidence: 0.8,
          reason: `包含提问词"${p}"和${detectedSubj.subject}关键词`,
        };
      }
      if (currentSessionState && currentSessionState.sessionId) {
        return {
          intent: 'new_question',
          detectedSubject: currentSessionState.subject,
          detectedTopic: t.slice(0, 20),
          detectedVisualType: 'none',
          confidence: 0.7,
          reason: `包含提问词"${p}"，可能是新问题`,
        };
      }
      return {
        intent: 'new_question',
        detectedSubject: SubjectLabels.math,
        detectedTopic: t.slice(0, 20),
        detectedVisualType: 'none',
        confidence: 0.7,
        reason: `包含提问词"${p}"`,
      };
    }
  }

  if (currentSessionState && currentSessionState.sessionId && currentSessionState.topic && currentSessionState.topic !== '通用问题') {
    const shortAnswerPatterns = ['不知道', '不会', '不清楚', '没学过', '不懂', '不明白', '是', '不是', '对', '错', '没有', '有', '经济', '政治', '军事', '文化', '内错角相等', '180度', '匀速', '6', '12'];
    if (t.length <= 10) {
      for (const p of shortAnswerPatterns) {
        if (t === p || t.startsWith(p)) {
          return { intent: 'student_answer', confidence: 0.9, reason: `短回答"${t}"，像是对"${currentSessionState.lastQuestion || '上一轮问题'}"的回答` };
        }
      }
    }

    const domainKeywords: Record<string, string[]> = {
      '唐朝强盛原因': ['政治', '经济', '军事', '文化', '对外', '交流', '制度', '农业', '商业', '科举', '丝路'],
      '牛顿第一定律': ['力', '惯性', '匀速', '静止', '摩擦', '运动'],
      '三角形内角和': ['角', '平行', '内错', '同位', '平角', '180'],
      '三国时期': ['黄巾', '董卓', '曹操', '刘备', '孙权', '赤壁', '官渡'],
      '长方形面积': ['长', '宽', '排', '列', '方格', '乘'],
      '光合作用': ['光', '二氧化碳', '水', '氧气', '有机', '叶绿'],
    };
    const currentDomainWords = domainKeywords[currentSessionState.topic];
    if (currentDomainWords && t.length <= 15) {
      const isDomainAnswer = currentDomainWords.some(k => t.includes(k));
      if (isDomainAnswer) {
        return { intent: 'student_answer', confidence: 0.8, reason: `回答包含当前知识点"${currentSessionState.topic}"相关词` };
      }
    }

    if (t.length <= 20 && !t.includes('，') && !t.includes('。') && !t.includes('！')) {
      return { intent: 'student_answer', confidence: 0.6, reason: `短输入"${t}"，可能是对当前问题的回答` };
    }
  }

  if (routed) {
    return {
      intent: 'new_question',
      detectedSubject: routed.subject,
      detectedTopic: routed.topic,
      detectedVisualType: routed.visualType,
      confidence: 0.85,
      reason: `匹配已知知识点"${routed.topic}"`,
    };
  }

  return { intent: 'unknown', confidence: 0.5, reason: '无法确定意图' };
}

type AnswerType = 'correct' | 'wrong' | 'unknown' | 'irrelevant' | 'question';

function classifyStudentAnswer(
  studentAnswer: string,
  expectedStudentAnswer: string | undefined,
  sessionState: TutoringSession | null,
): { type: AnswerType; confidence: number } {
  const ans = studentAnswer.trim();
  if (!ans) return { type: 'irrelevant', confidence: 0.9 };

  const unknownPatterns = ['不知道', '不会', '不清楚', '没学过', '不懂', '不明白', '不了解', '不知道啊', '忘了', '忘记了', '想不起来'];
  for (const p of unknownPatterns) {
    if (ans.includes(p)) return { type: 'unknown', confidence: 0.9 };
  }

  const questionPatterns = ['为什么', '怎么回事', '什么意思', '怎么理解', '能不能解释', '为什么是', '凭什么'];
  for (const p of questionPatterns) {
    if (ans.includes(p)) return { type: 'question', confidence: 0.7 };
  }

  if (expectedStudentAnswer) {
    const expected = expectedStudentAnswer.toLowerCase();
    const answer = ans.toLowerCase();
    const expectedKeywords = expected.split(/[、，,\s]+/).filter(k => k.length > 0);
    const matchedCount = expectedKeywords.filter(k => answer.includes(k)).length;
    if (matchedCount > 0 && matchedCount >= expectedKeywords.length * 0.5) {
      return { type: 'correct', confidence: Math.min(1, matchedCount / expectedKeywords.length + 0.2) };
    }
  }

  if (sessionState && sessionState.topic) {
    const topicKeywords = sessionState.topic.split(/[、，,\s]+/).filter(k => k.length > 1);
    const answerLower = ans.toLowerCase();
    const topicMatch = topicKeywords.some(k => answerLower.includes(k.toLowerCase()));
    if (topicMatch) return { type: 'correct', confidence: 0.5 };

    const domainKeywords: Record<string, string[]> = {
      '唐朝强盛原因': ['政治', '经济', '军事', '文化', '对外', '交流', '制度', '农业', '商业', '科举', '丝路', '边疆', '诗歌', '民族'],
      '牛顿第一定律': ['力', '惯性', '匀速', '静止', '摩擦', '运动', '加速', '减速'],
      '三角形内角和': ['角', '平行', '内错', '同位', '平角', '180', '证明'],
      '三国时期': ['黄巾', '董卓', '曹操', '刘备', '孙权', '赤壁', '官渡', '魏蜀吴'],
      '长方形面积': ['长', '宽', '排', '列', '方格', '乘', '面积'],
      '光合作用': ['光', '二氧化碳', '水', '氧气', '有机', '叶绿', '叶'],
    };
    const domainWords = domainKeywords[sessionState.topic];
    if (domainWords) {
      const domainMatch = domainWords.some(k => answerLower.includes(k.toLowerCase()));
      if (domainMatch) return { type: 'correct', confidence: 0.6 };
    }
  }

  if (ans.length <= 4 && !expectedStudentAnswer) {
    return { type: 'wrong', confidence: 0.5 };
  }

  return { type: 'wrong', confidence: 0.6 };
}

const TANG_CAUSE_DATA = {
  title: '唐朝强盛原因',
  center: '唐朝强盛',
  nodes: [
    { id: 'politics', label: '政治制度', description: '制度较成熟，国家治理能力较强' },
    { id: 'economy', label: '经济发展', description: '农业、手工业、商业发展' },
    { id: 'military', label: '军事力量', description: '前期军事实力强，边疆控制力强' },
    { id: 'culture', label: '文化开放', description: '科举、诗歌、宗教和多民族文化交流活跃' },
    { id: 'foreign', label: '对外交流', description: '丝绸之路和国际交往频繁' },
  ],
};

function mockTutorResponse(
  userMessage: string,
  currentSubject: Subject,
  sessionState: TutoringSession | null,
): TutoringResponse {
  const msg = userMessage;
  const subjectLabel = SubjectLabels[currentSubject];

  if (sessionState && sessionState.sessionId && sessionState.topic && sessionState.topic !== '通用问题') {
    return mockContinuationResponse(msg, sessionState, subjectLabel);
  }

  if (msg.includes('牛顿') || msg.includes('冰壶') || msg.includes('摩擦') || msg.includes('光滑') || msg.includes('滑下去') || msg.includes('第一定律')) {
    return {
      detected_subject: '物理',
      detected_topic: '牛顿第一定律',
      detected_grade: '高一',
      selected_subject: subjectLabel,
      should_switch_subject: currentSubject !== 'physics',
      teaching_mode: 'socratic_visual',
      current_step: 1,
      reply: '我们先只看受力。假设冰壶在光滑水平面上运动，没有摩擦力和空气阻力。',
      question_to_student: '你觉得它在水平方向上还受到阻碍它运动的力吗？',
      visual: {
        type: 'force_diagram',
        stepIndex: 1,
        data: {
          objectLabel: '冰壶',
          surfaceLabel: '光滑冰面',
          showGravity: true,
          showNormal: true,
          showVelocity: true,
          showFriction: false,
          showAirResistance: false,
          motionState: 'uniform',
        },
      },
      expected_student_answer: '没有',
      misconception_check: ['认为物体运动需要持续受力', '把惯性误认为一种力'],
      hint_level: 1,
      next_action: 'wait_student_answer',
    };
  }

  if (msg.includes('三国') || msg.includes('赤壁') || msg.includes('黄巾') || msg.includes('曹操') || msg.includes('刘备') || msg.includes('孙权')) {
    return {
      detected_subject: '历史',
      detected_topic: '三国时期',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: currentSubject !== 'history',
      teaching_mode: 'socratic_visual',
      current_step: 1,
      reply: '三国时期是中国历史上非常精彩的乱世。',
      question_to_student: '你知道三国时期开始于哪个著名的事件吗？',
      visual: {
        type: 'timeline',
        stepIndex: 0,
        data: {},
      },
      expected_student_answer: '黄巾起义',
      misconception_check: [],
      hint_level: 0,
      next_action: 'wait_student_answer',
    };
  }

  if (msg.includes('长方形') || msg.includes('面积')) {
    return {
      detected_subject: '数学',
      detected_topic: '长方形面积',
      detected_grade: '四年级',
      selected_subject: subjectLabel,
      should_switch_subject: currentSubject !== 'math',
      teaching_mode: 'socratic_visual',
      current_step: 1,
      reply: '我们来看看长方形的面积怎么算。',
      question_to_student: '第一排有几个小方格？',
      visual: {
        type: 'rectangle_grid',
        stepIndex: 1,
        data: { rows: 3, cols: 4 },
      },
      expected_student_answer: '4个',
      misconception_check: [],
      hint_level: 0,
      next_action: 'wait_student_answer',
    };
  }

  if (msg.includes('三角形') || msg.includes('内角和') || msg.includes('180')) {
    return {
      detected_subject: '数学',
      detected_topic: '三角形内角和',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: currentSubject !== 'math' && currentSubject !== 'geometry',
      teaching_mode: 'socratic_visual',
      current_step: 1,
      reply: '我们先不直接背结论。看图，我过顶点 A 画了一条和 BC 平行的直线。',
      question_to_student: '你还记得平行线被一条直线截开时，内错角有什么关系吗？',
      visual: {
        type: 'triangle_angle_sum_parallel',
        stepIndex: 1,
        data: { showParallel: true, highlightAngle: 'A' },
      },
      expected_student_answer: '内错角相等',
      misconception_check: ['把结论当原因', '不知道内错角相等'],
      hint_level: 1,
      next_action: 'wait_student_answer',
    };
  }

  if (msg.includes('光合') || msg.includes('植物') || msg.includes('叶绿体')) {
    return {
      detected_subject: '生物',
      detected_topic: '光合作用',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: currentSubject !== 'biology',
      teaching_mode: 'socratic_visual',
      current_step: 1,
      reply: '光合作用是植物最神奇的本领之一。',
      question_to_student: '你知道植物光合作用需要哪些原料吗？',
      visual: { type: 'none', stepIndex: 0 },
      expected_student_answer: '二氧化碳和水',
      misconception_check: ['认为光合作用不需要水'],
      hint_level: 0,
      next_action: 'wait_student_answer',
    };
  }

  if (msg.includes('唐朝') || msg.includes('盛唐') || msg.includes('唐朝强盛') || (msg.includes('唐') && (msg.includes('强大') || msg.includes('强盛') || msg.includes('繁荣')))) {
    return {
      detected_subject: '历史',
      detected_topic: '唐朝强盛原因',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: currentSubject !== 'history',
      teaching_mode: 'socratic_visual',
      current_step: 1,
      reply: '我们先不直接背结论。一个朝代强大，通常要从政治、经济、军事、文化和对外交流几个方面看。',
      question_to_student: '你觉得一个国家强大，最先应该看哪一方面？',
      visual: {
        type: 'cause_effect_graph',
        stepIndex: 1,
        data: TANG_CAUSE_DATA,
      },
      expected_student_answer: '政治、经济、军事、文化、对外交流都可以',
      misconception_check: ['只用一个原因解释强盛', '把唐朝强大只归因于皇帝个人'],
      hint_level: 1,
      next_action: 'wait_student_answer',
    };
  }

  if (msg.includes('负负得正') || msg.includes('负数') || msg.includes('乘法')) {
    return {
      detected_subject: '数学',
      detected_topic: '负负得正',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: currentSubject !== 'math',
      teaching_mode: 'socratic_visual',
      current_step: 1,
      reply: '负负得正是有道理的，我们用数轴来理解。',
      question_to_student: '如果 -3 × 2 = -6，那 -3 × (-2) 应该等于多少？',
      visual: { type: 'none', stepIndex: 0 },
      expected_student_answer: '6',
      misconception_check: ['认为负负得正没有道理'],
      hint_level: 0,
      next_action: 'wait_student_answer',
    };
  }

  if (msg.includes('水') || msg.includes('分子') || msg.includes('H2O')) {
    return {
      detected_subject: '化学',
      detected_topic: '水分子结构',
      detected_grade: '初三',
      selected_subject: subjectLabel,
      should_switch_subject: currentSubject !== 'chemistry',
      teaching_mode: 'socratic_visual',
      current_step: 1,
      reply: '水分子虽然很小，但结构很有趣。',
      question_to_student: '你知道一个水分子由几个原子组成吗？',
      visual: { type: 'none', stepIndex: 0 },
      expected_student_answer: '3个',
      misconception_check: [],
      hint_level: 0,
      next_action: 'wait_student_answer',
    };
  }

  if (msg.includes('二次函数') || msg.includes('抛物线') || msg.includes('顶点')) {
    return {
      detected_subject: '数学',
      detected_topic: '二次函数',
      detected_grade: '初三',
      selected_subject: subjectLabel,
      should_switch_subject: currentSubject !== 'math',
      teaching_mode: 'socratic_visual',
      current_step: 1,
      reply: '二次函数的图像是一条抛物线。',
      question_to_student: '你知道 y = x² 的图像开口朝哪个方向吗？',
      visual: { type: 'none', stepIndex: 0 },
      expected_student_answer: '向上',
      misconception_check: [],
      hint_level: 0,
      next_action: 'wait_student_answer',
    };
  }

  return {
    detected_subject: subjectLabel,
    detected_topic: '通用问题',
    detected_grade: GradeLabels['7'] || '初一',
    selected_subject: subjectLabel,
    should_switch_subject: false,
    teaching_mode: 'socratic_visual',
    current_step: 1,
    reply: '这是一个好问题！让我想想怎么引导你。',
    question_to_student: '你能告诉我你想了解哪个学科的问题吗？',
    visual: { type: 'none', stepIndex: 0 },
    expected_student_answer: '',
    misconception_check: [],
    hint_level: 0,
    next_action: 'wait_student_answer',
  };
}

function mockContinuationResponse(
  userMessage: string,
  session: TutoringSession,
  subjectLabel: string,
): TutoringResponse {
  const classification = classifyStudentAnswer(userMessage, session.expectedStudentAnswer, session);
  const currentStep = session.currentStep;
  const maxStep = session.maxStep || VISUAL_MAX_STEPS[session.visualType] || 4;
  const currentHint = session.hintLevel || 0;

  if (session.topic === '唐朝强盛原因' && session.visualType === 'cause_effect_graph') {
    return mockTangContinuation(userMessage, classification, currentStep, maxStep, currentHint, subjectLabel);
  }

  if (session.topic === '三国时期' && session.visualType === 'timeline') {
    return mockTimelineContinuation(userMessage, classification, currentStep, maxStep, currentHint, subjectLabel);
  }

  if (session.topic === '三角形内角和' && session.visualType === 'triangle_angle_sum_parallel') {
    return mockTriangleContinuation(userMessage, classification, currentStep, maxStep, currentHint, subjectLabel);
  }

  if (session.topic === '牛顿第一定律' && session.visualType === 'force_diagram') {
    return mockForceContinuation(userMessage, classification, currentStep, maxStep, currentHint, subjectLabel);
  }

  if (session.topic === '长方形面积' && session.visualType === 'rectangle_grid') {
    return mockRectangleContinuation(userMessage, classification, currentStep, maxStep, currentHint, subjectLabel);
  }

  if (session.topic === '光合作用') {
    return mockPhotosynthesisContinuation(userMessage, classification, currentStep, maxStep, currentHint, subjectLabel);
  }

  return mockGenericContinuation(userMessage, classification, currentStep, maxStep, currentHint, session, subjectLabel);
}

function mockTangContinuation(
  userMessage: string,
  classification: { type: AnswerType; confidence: number },
  currentStep: number,
  maxStep: number,
  currentHint: number,
  subjectLabel: string,
): TutoringResponse {
  const stepReplies: Record<number, { reply: string; question: string; expected: string; node: string }> = {
    1: {
      reply: '我们先不直接背结论。一个朝代强大，通常要从政治、经济、军事、文化和对外交流几个方面看。',
      question: '你觉得一个国家强大，最先应该看哪一方面？',
      expected: '政治、经济、军事、文化、对外交流都可以',
      node: '政治制度',
    },
    2: {
      reply: '唐朝的政治制度比较成熟，比如三省六部制让国家治理更高效。',
      question: '除了政治，你觉得经济对一个朝代有多重要？',
      expected: '经济很重要，粮食充足国家才稳定',
      node: '经济发展',
    },
    3: {
      reply: '唐朝前期军事力量强大，边疆控制力强，保障了国家安全。',
      question: '军事强大就够了么？还有什么因素？',
      expected: '不够，还需要文化和对外交流',
      node: '军事力量',
    },
    4: {
      reply: '唐朝文化非常开放，科举制选拔人才，诗歌繁荣，多民族文化交流活跃。',
      question: '最后一个方面：对外交流呢？',
      expected: '丝绸之路让唐朝和世界联通',
      node: '文化开放',
    },
    5: {
      reply: '丝绸之路让唐朝与西亚、欧洲频繁交流，吸收外来文化，也传播了中华文明。',
      question: '现在你能总结一下唐朝强盛的主要原因吗？',
      expected: '政治制度、经济发展、军事力量、文化开放、对外交流',
      node: '对外交流',
    },
  };

  if (classification.type === 'unknown') {
    const hintLevel = Math.min(3, currentHint + 1);
    const hints: Record<number, { reply: string; question: string; step: number }> = {
      1: {
        reply: '没关系。我们先从最容易理解的角度看：经济。一个朝代如果粮食充足、商业活跃，国家就更容易稳定和强大。',
        question: '你觉得经济发展会怎样帮助一个国家变强？',
        step: 2,
      },
      2: {
        reply: '我给你一个提示：想想唐朝农民种地、商人做买卖，这些和国家的强弱有什么关系？',
        question: '如果粮食很多、商业很发达，国家会怎样？',
        step: 2,
      },
      3: {
        reply: '直接说吧：经济好意味着国家收的税多，有钱养军队、修路、搞建设。',
        question: '那你觉得经济和军事之间有联系吗？',
        step: 2,
      },
    };
    const hint = hints[Math.min(hintLevel, 3)] || hints[3];
    return {
      detected_subject: '历史',
      detected_topic: '唐朝强盛原因',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'socratic_visual',
      current_step: hint.step,
      reply: hint.reply,
      question_to_student: hint.question,
      visual: {
        type: 'cause_effect_graph',
        stepIndex: hint.step,
        data: TANG_CAUSE_DATA,
      },
      expected_student_answer: '经济好国家就强',
      misconception_check: [],
      hint_level: hintLevel,
      next_action: 'show_hint',
    };
  }

  if (classification.type === 'question') {
    return {
      detected_subject: '历史',
      detected_topic: '唐朝强盛原因',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'socratic_visual',
      current_step: currentStep,
      reply: '好问题！我们一步步来看。',
      question_to_student: stepReplies[currentStep]?.question || '你觉得唐朝为什么强大？',
      visual: {
        type: 'cause_effect_graph',
        stepIndex: Math.min(currentStep, 5),
        data: TANG_CAUSE_DATA,
      },
      expected_student_answer: stepReplies[currentStep]?.expected || '',
      misconception_check: [],
      hint_level: currentHint,
      next_action: 'wait_student_answer',
    };
  }

  const nextStep = Math.min(currentStep + 1, maxStep);
  const stepInfo = stepReplies[currentStep] || stepReplies[1];
  const nextInfo = stepReplies[nextStep];

  if (classification.type === 'correct' || classification.type === 'wrong') {
    const isCorrect = classification.type === 'correct';
    if (currentStep >= maxStep) {
      return {
        detected_subject: '历史',
        detected_topic: '唐朝强盛原因',
        detected_grade: '初一',
        selected_subject: subjectLabel,
        should_switch_subject: false,
        teaching_mode: 'explanation',
        current_step: maxStep,
        reply: isCorrect ? '很好！' : '没关系，我来总结。',
        question_to_student: '唐朝强盛的主要原因有：政治制度成熟、经济发达、军事强大、文化开放、对外交流频繁。你记住了吗？',
        visual: {
          type: 'cause_effect_graph',
          stepIndex: 5,
          data: TANG_CAUSE_DATA,
        },
        expected_student_answer: '记住了',
        misconception_check: isCorrect ? [] : ['只用一个原因解释强盛'],
        hint_level: 0,
        next_action: 'give_summary',
      };
    }

    return {
      detected_subject: '历史',
      detected_topic: '唐朝强盛原因',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'socratic_visual',
      current_step: nextStep,
      reply: isCorrect ? `对！${nextInfo?.reply || ''}` : `不完全对，但没关系。${nextInfo?.reply || ''}`,
      question_to_student: nextInfo?.question || '继续看下一个方面？',
      visual: {
        type: 'cause_effect_graph',
        stepIndex: nextStep,
        data: TANG_CAUSE_DATA,
      },
      expected_student_answer: nextInfo?.expected || '',
      misconception_check: isCorrect ? [] : ['只用一个原因解释强盛'],
      hint_level: 0,
      next_action: 'advance_step',
    };
  }

  return {
    detected_subject: '历史',
    detected_topic: '唐朝强盛原因',
    detected_grade: '初一',
    selected_subject: subjectLabel,
    should_switch_subject: false,
    teaching_mode: 'socratic_visual',
    current_step: currentStep,
    reply: stepInfo.reply,
    question_to_student: stepInfo.question,
    visual: {
      type: 'cause_effect_graph',
      stepIndex: currentStep,
      data: TANG_CAUSE_DATA,
    },
    expected_student_answer: stepInfo.expected,
    misconception_check: [],
    hint_level: currentHint,
    next_action: 'wait_student_answer',
  };
}

function mockTimelineContinuation(
  userMessage: string,
  classification: { type: AnswerType; confidence: number },
  currentStep: number,
  maxStep: number,
  currentHint: number,
  subjectLabel: string,
): TutoringResponse {
  const stepReplies: Record<number, { reply: string; question: string; expected: string }> = {
    1: { reply: '黄巾起义是三国乱世的起点。', question: '黄巾起义之后，谁趁乱控制了朝廷？', expected: '董卓' },
    2: { reply: '董卓进京后天下更乱了。', question: '后来谁在官渡之战中以少胜多？', expected: '曹操' },
    3: { reply: '曹操统一了北方。', question: '赤壁之战是谁和谁联手打败了曹操？', expected: '孙权和刘备' },
    4: { reply: '赤壁之战后三国格局基本形成。', question: '你知道魏蜀吴分别是哪年建立的吗？', expected: '220、221、229年' },
  };

  if (classification.type === 'unknown') {
    const hintLevel = Math.min(3, currentHint + 1);
    return {
      detected_subject: '历史',
      detected_topic: '三国时期',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'socratic_visual',
      current_step: currentStep,
      reply: '没关系，我给你一个提示。',
      question_to_student: `看看时间轴上第${currentStep}个事件，它的描述能帮到你。`,
      visual: { type: 'timeline', stepIndex: currentStep - 1, data: {} },
      expected_student_answer: '',
      misconception_check: [],
      hint_level: hintLevel,
      next_action: 'show_hint',
    };
  }

  const nextStep = Math.min(currentStep + 1, maxStep);
  const nextInfo = stepReplies[nextStep];

  if (currentStep >= maxStep) {
    return {
      detected_subject: '历史',
      detected_topic: '三国时期',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'explanation',
      current_step: maxStep,
      reply: '三国时期从184年黄巾起义开始，到280年西晋灭吴结束。',
      question_to_student: '你还有什么想了解的吗？',
      visual: { type: 'timeline', stepIndex: 7, data: {} },
      expected_student_answer: '',
      misconception_check: [],
      hint_level: 0,
      next_action: 'give_summary',
    };
  }

  return {
    detected_subject: '历史',
    detected_topic: '三国时期',
    detected_grade: '初一',
    selected_subject: subjectLabel,
    should_switch_subject: false,
    teaching_mode: 'socratic_visual',
    current_step: nextStep,
    reply: classification.type === 'correct' ? `对！${nextInfo?.reply || ''}` : `没关系。${nextInfo?.reply || ''}`,
    question_to_student: nextInfo?.question || '继续？',
    visual: { type: 'timeline', stepIndex: nextStep - 1, data: {} },
    expected_student_answer: nextInfo?.expected || '',
    misconception_check: [],
    hint_level: 0,
    next_action: 'advance_step',
  };
}

function mockTriangleContinuation(
  userMessage: string,
  classification: { type: AnswerType; confidence: number },
  currentStep: number,
  maxStep: number,
  currentHint: number,
  subjectLabel: string,
): TutoringResponse {
  const stepReplies: Record<number, { reply: string; question: string; expected: string }> = {
    1: { reply: '看图，我过顶点 A 画了一条和 BC 平行的直线。', question: '平行线被一条直线截开时，内错角有什么关系？', expected: '内错角相等' },
    2: { reply: '对！内错角相等。所以角1等于角2。', question: '那同位角呢？角3和角4什么关系？', expected: '同位角相等' },
    3: { reply: '现在三个角拼在一起，形成了一个平角。', question: '平角是多少度？', expected: '180度' },
    4: { reply: '所以三角形的三个内角加起来就是180度！', question: '你能用自己的话再说一遍这个证明过程吗？', expected: '通过平行线把三个角拼成平角' },
  };

  if (classification.type === 'unknown') {
    const hintLevel = Math.min(3, currentHint + 1);
    const hints: Record<number, { reply: string; question: string }> = {
      1: { reply: '提示：两条平行线被第三条直线截开时，会产生一些特殊的角。', question: '内错角的大小有什么关系？' },
      2: { reply: '提示：同位角和内错角一样，也是相等的。', question: '角3和角4是同位角，它们相等吗？' },
      3: { reply: '提示：三个角拼在一起，刚好在一条直线上。', question: '一条直线上的角叫什么角？是多少度？' },
    };
    const hint = hints[currentStep] || hints[1];
    return {
      detected_subject: '几何',
      detected_topic: '三角形内角和',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'socratic_visual',
      current_step: currentStep,
      reply: hint.reply,
      question_to_student: hint.question,
      visual: { type: 'triangle_angle_sum_parallel', stepIndex: currentStep, data: { showParallel: true } },
      expected_student_answer: '',
      misconception_check: [],
      hint_level: hintLevel,
      next_action: 'show_hint',
    };
  }

  const nextStep = Math.min(currentStep + 1, maxStep);
  const nextInfo = stepReplies[nextStep];

  if (currentStep >= maxStep) {
    return {
      detected_subject: '几何',
      detected_topic: '三角形内角和',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'explanation',
      current_step: maxStep,
      reply: '三角形内角和等于180度，证明的关键是利用平行线的性质。',
      question_to_student: '你还有其他疑问吗？',
      visual: { type: 'triangle_angle_sum_parallel', stepIndex: 5, data: { showParallel: true } },
      expected_student_answer: '',
      misconception_check: [],
      hint_level: 0,
      next_action: 'give_summary',
    };
  }

  return {
    detected_subject: '几何',
    detected_topic: '三角形内角和',
    detected_grade: '初一',
    selected_subject: subjectLabel,
    should_switch_subject: false,
    teaching_mode: 'socratic_visual',
    current_step: nextStep,
    reply: classification.type === 'correct' ? `对！${nextInfo?.reply || ''}` : `没关系。${nextInfo?.reply || ''}`,
    question_to_student: nextInfo?.question || '继续？',
    visual: { type: 'triangle_angle_sum_parallel', stepIndex: nextStep, data: { showParallel: true } },
    expected_student_answer: nextInfo?.expected || '',
    misconception_check: [],
    hint_level: 0,
    next_action: 'advance_step',
  };
}

function mockForceContinuation(
  userMessage: string,
  classification: { type: AnswerType; confidence: number },
  currentStep: number,
  maxStep: number,
  currentHint: number,
  subjectLabel: string,
): TutoringResponse {
  const stepReplies: Record<number, { reply: string; question: string; expected: string }> = {
    1: { reply: '对！没有摩擦力，冰壶在水平方向不受力。', question: '那它会怎样运动？加速、减速还是匀速？', expected: '匀速' },
    2: { reply: '这就是牛顿第一定律：不受力的物体保持匀速直线运动或静止。', question: '如果突然有了摩擦力呢？', expected: '会减速' },
    3: { reply: '所以力不是维持运动的原因，力是改变运动状态的原因。', question: '你能用自己的话说一下牛顿第一定律吗？', expected: '不受力就匀速或静止' },
  };

  if (classification.type === 'unknown') {
    const hintLevel = Math.min(3, currentHint + 1);
    return {
      detected_subject: '物理',
      detected_topic: '牛顿第一定律',
      detected_grade: '高一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'socratic_visual',
      current_step: currentStep,
      reply: '没关系，我换个角度问。',
      question_to_student: currentStep === 1 ? '冰面上很滑，几乎没有摩擦力。那冰壶在水平方向还受什么力？' : '想想看，如果没有力推它，它会怎样？',
      visual: {
        type: 'force_diagram',
        stepIndex: currentStep,
        data: { objectLabel: '冰壶', surfaceLabel: '光滑冰面', showGravity: true, showNormal: true, showVelocity: true, showFriction: false, motionState: 'uniform' },
      },
      expected_student_answer: '',
      misconception_check: [],
      hint_level: hintLevel,
      next_action: 'show_hint',
    };
  }

  const nextStep = Math.min(currentStep + 1, maxStep);
  const nextInfo = stepReplies[nextStep];

  if (currentStep >= maxStep) {
    return {
      detected_subject: '物理',
      detected_topic: '牛顿第一定律',
      detected_grade: '高一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'explanation',
      current_step: maxStep,
      reply: '牛顿第一定律：一切物体在没有受到外力作用时，总保持匀速直线运动状态或静止状态。',
      question_to_student: '你还有什么疑问吗？',
      visual: {
        type: 'force_diagram',
        stepIndex: maxStep,
        data: { objectLabel: '冰壶', surfaceLabel: '光滑冰面', showGravity: true, showNormal: true, showVelocity: true, showFriction: false, motionState: 'uniform' },
      },
      expected_student_answer: '',
      misconception_check: [],
      hint_level: 0,
      next_action: 'give_summary',
    };
  }

  return {
    detected_subject: '物理',
    detected_topic: '牛顿第一定律',
    detected_grade: '高一',
    selected_subject: subjectLabel,
    should_switch_subject: false,
    teaching_mode: 'socratic_visual',
    current_step: nextStep,
    reply: classification.type === 'correct' ? `对！${nextInfo?.reply || ''}` : `没关系。${nextInfo?.reply || ''}`,
    question_to_student: nextInfo?.question || '继续？',
    visual: {
      type: 'force_diagram',
      stepIndex: nextStep,
      data: { objectLabel: '冰壶', surfaceLabel: '光滑冰面', showGravity: true, showNormal: true, showVelocity: true, showFriction: false, motionState: 'uniform' },
    },
    expected_student_answer: nextInfo?.expected || '',
    misconception_check: [],
    hint_level: 0,
    next_action: 'advance_step',
  };
}

function mockRectangleContinuation(
  userMessage: string,
  classification: { type: AnswerType; confidence: number },
  currentStep: number,
  maxStep: number,
  currentHint: number,
  subjectLabel: string,
): TutoringResponse {
  const stepReplies: Record<number, { reply: string; question: string; expected: string }> = {
    1: { reply: '对，第一排有4个方格。', question: '那一共有几排？', expected: '3排' },
    2: { reply: '3排，每排4个。', question: '总共多少个方格？', expected: '12个' },
    3: { reply: '所以长方形面积 = 长 × 宽 = 4 × 3 = 12。', question: '如果长是5、宽是2呢？', expected: '10' },
  };

  if (classification.type === 'unknown') {
    const hintLevel = Math.min(3, currentHint + 1);
    return {
      detected_subject: '数学',
      detected_topic: '长方形面积',
      detected_grade: '四年级',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'socratic_visual',
      current_step: currentStep,
      reply: '没关系，数一数图上的方格。',
      question_to_student: currentStep === 1 ? '横着数，第一排有几个？' : '竖着数，有几排？',
      visual: { type: 'rectangle_grid', stepIndex: currentStep, data: { rows: 3, cols: 4 } },
      expected_student_answer: '',
      misconception_check: [],
      hint_level: hintLevel,
      next_action: 'show_hint',
    };
  }

  const nextStep = Math.min(currentStep + 1, maxStep);
  const nextInfo = stepReplies[nextStep];

  if (currentStep >= maxStep) {
    return {
      detected_subject: '数学',
      detected_topic: '长方形面积',
      detected_grade: '四年级',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'explanation',
      current_step: maxStep,
      reply: '长方形面积 = 长 × 宽。',
      question_to_student: '你还有其他疑问吗？',
      visual: { type: 'rectangle_grid', stepIndex: maxStep, data: { rows: 3, cols: 4 } },
      expected_student_answer: '',
      misconception_check: [],
      hint_level: 0,
      next_action: 'give_summary',
    };
  }

  return {
    detected_subject: '数学',
    detected_topic: '长方形面积',
    detected_grade: '四年级',
    selected_subject: subjectLabel,
    should_switch_subject: false,
    teaching_mode: 'socratic_visual',
    current_step: nextStep,
    reply: classification.type === 'correct' ? `对！${nextInfo?.reply || ''}` : `没关系。${nextInfo?.reply || ''}`,
    question_to_student: nextInfo?.question || '继续？',
    visual: { type: 'rectangle_grid', stepIndex: nextStep, data: { rows: 3, cols: 4 } },
    expected_student_answer: nextInfo?.expected || '',
    misconception_check: [],
    hint_level: 0,
    next_action: 'advance_step',
  };
}

function mockPhotosynthesisContinuation(
  userMessage: string,
  classification: { type: AnswerType; confidence: number },
  currentStep: number,
  maxStep: number,
  currentHint: number,
  subjectLabel: string,
): TutoringResponse {
  const stepReplies: Record<number, { reply: string; question: string; expected: string }> = {
    1: { reply: '对，光合作用需要二氧化碳和水。', question: '光合作用产生了什么？', expected: '氧气和有机物' },
    2: { reply: '植物用二氧化碳和水，在光照下制造有机物并释放氧气。', question: '光合作用发生在植物的哪个部位？', expected: '叶绿体' },
    3: { reply: '叶绿体是光合作用的场所，含有叶绿素。', question: '你能总结一下光合作用的公式吗？', expected: '二氧化碳+水→有机物+氧气' },
  };

  if (classification.type === 'unknown') {
    const hintLevel = Math.min(3, currentHint + 1);
    return {
      detected_subject: '生物',
      detected_topic: '光合作用',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'socratic_visual',
      current_step: currentStep,
      reply: '没关系，我提示你。',
      question_to_student: currentStep === 1 ? '植物从空气中吸收什么气体？' : '植物从土壤中吸收什么？',
      visual: { type: 'none', stepIndex: 0 },
      expected_student_answer: '',
      misconception_check: [],
      hint_level: hintLevel,
      next_action: 'show_hint',
    };
  }

  const nextStep = Math.min(currentStep + 1, maxStep);
  const nextInfo = stepReplies[nextStep];

  if (currentStep >= maxStep) {
    return {
      detected_subject: '生物',
      detected_topic: '光合作用',
      detected_grade: '初一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'explanation',
      current_step: maxStep,
      reply: '光合作用：二氧化碳 + 水 → 有机物 + 氧气（在光照和叶绿体作用下）。',
      question_to_student: '你还有其他疑问吗？',
      visual: { type: 'none', stepIndex: 0 },
      expected_student_answer: '',
      misconception_check: [],
      hint_level: 0,
      next_action: 'give_summary',
    };
  }

  return {
    detected_subject: '生物',
    detected_topic: '光合作用',
    detected_grade: '初一',
    selected_subject: subjectLabel,
    should_switch_subject: false,
    teaching_mode: 'socratic_visual',
    current_step: nextStep,
    reply: classification.type === 'correct' ? `对！${nextInfo?.reply || ''}` : `没关系。${nextInfo?.reply || ''}`,
    question_to_student: nextInfo?.question || '继续？',
    visual: { type: 'none', stepIndex: 0 },
    expected_student_answer: nextInfo?.expected || '',
    misconception_check: [],
    hint_level: 0,
    next_action: 'advance_step',
  };
}

function mockGenericContinuation(
  userMessage: string,
  classification: { type: AnswerType; confidence: number },
  currentStep: number,
  maxStep: number,
  currentHint: number,
  session: TutoringSession,
  subjectLabel: string,
): TutoringResponse {
  if (classification.type === 'unknown') {
    const hintLevel = Math.min(3, currentHint + 1);
    return {
      detected_subject: session.subject || subjectLabel,
      detected_topic: session.topic || '通用问题',
      detected_grade: session.grade || '初一',
      selected_subject: subjectLabel,
      should_switch_subject: false,
      teaching_mode: 'socratic_visual',
      current_step: currentStep,
      reply: '没关系，我换个方式问。',
      question_to_student: session.lastQuestion || '你能再想想吗？',
      visual: { type: (session.visualType || 'none') as VisualType, stepIndex: currentStep },
      expected_student_answer: session.expectedStudentAnswer || '',
      misconception_check: [],
      hint_level: hintLevel,
      next_action: 'show_hint',
    };
  }

  const nextStep = Math.min(currentStep + 1, maxStep);
  return {
    detected_subject: session.subject || subjectLabel,
    detected_topic: session.topic || '通用问题',
    detected_grade: session.grade || '初一',
    selected_subject: subjectLabel,
    should_switch_subject: false,
    teaching_mode: 'socratic_visual',
    current_step: nextStep,
    reply: classification.type === 'correct' ? '对！继续。' : '没关系，我们继续。',
    question_to_student: '我们进入下一步。',
    visual: { type: (session.visualType || 'none') as VisualType, stepIndex: nextStep },
    expected_student_answer: '',
    misconception_check: [],
    hint_level: 0,
    next_action: 'advance_step',
  };
}

export default function App() {
  const [subject, setSubject] = useState<Subject>('math');
  const [grade, setGrade] = useState<Grade>('7');
  const [model, setModel] = useState<ModelProvider>('deepseek');
  const [currentResponse, setCurrentResponse] = useState<TutoringResponse | null>(null);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjectAlert, setSubjectAlert] = useState<TutoringResponse | null>(null);
  const [localStepIndex, setLocalStepIndex] = useState(0);
  const [sessionState, setSessionState] = useState<TutoringSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    setInputText('');
    setIsStreaming(true);
    setSubjectAlert(null);
    setUsedFallback(false);

    const inputClassification = classifyUserInput(text, sessionState);
    console.log('[Input Classification]', inputClassification);

    let effectiveSessionState: TutoringSession | null = sessionState;
    let shouldResetSession = false;

    if (inputClassification.intent === 'new_question') {
      effectiveSessionState = null;
      shouldResetSession = true;
      setSessionState(null);
      setCurrentResponse(null);
      setLocalStepIndex(0);
      conversationHistoryRef.current = [];

      if (inputClassification.detectedSubject) {
        const detectedKey = SUBJECT_LABEL_TO_KEY[inputClassification.detectedSubject];
        if (detectedKey && detectedKey !== subject) {
          setSubject(detectedKey);
        }
      }
    }

    const userMsg: ChatMessage = { role: 'user', content: text, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    const loadingMsg: ChatMessage = { role: 'assistant', content: '正在思考...', createdAt: Date.now(), loading: true };
    setMessages((prev) => [...prev, loadingMsg]);

    if (!shouldResetSession) {
      conversationHistoryRef.current.push({ role: 'user', content: text });
    } else {
      conversationHistoryRef.current = [{ role: 'user', content: text }];
    }

    let rawContent = '';
    let finalParsed: TutoringResponse | null = null;
    let wasApiError = false;

    const currentSubject = inputClassification.detectedSubject
      ? (SUBJECT_LABEL_TO_KEY[inputClassification.detectedSubject] || subject)
      : subject;

    const payload = {
      userMessage: text,
      selectedSubject: currentSubject,
      selectedGrade: grade,
      conversationHistory: conversationHistoryRef.current.slice(0, -1),
      currentStep: effectiveSessionState ? effectiveSessionState.currentStep : 1,
      modelProvider: model,
      sessionState: effectiveSessionState ? {
        ...effectiveSessionState,
        studentAnswers: [...effectiveSessionState.studentAnswers, text],
        hintLevel: effectiveSessionState.hintLevel || 0,
      } : undefined,
    };

    console.log('[Tutor Request]', payload);

    try {
      const res = await fetch(`${API_BASE}/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`服务器错误: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error && !parsed.parsed) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                rawContent += parsed.content;
              }
              if (parsed.parsed) {
                finalParsed = parsed.parsed;
              }
            } catch (e: any) {
              if (e.message && !e.message.includes('JSON')) {
                throw e;
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.warn('[tutor] 真实 tutor API 调用失败，已使用本地 mock:', error.message);
      finalParsed = mockTutorResponse(text, currentSubject, effectiveSessionState);
      wasApiError = true;
    }

    if (!finalParsed && rawContent) {
      finalParsed = parseTutoringResponse(rawContent);
    }

    if (!finalParsed) {
      console.warn('[tutor] 解析失败，使用本地 mock');
      finalParsed = mockTutorResponse(text, currentSubject, effectiveSessionState);
      wasApiError = true;
    }

    console.log('[Tutor Response]', finalParsed);

    if (wasApiError) {
      setUsedFallback(true);
    }

    conversationHistoryRef.current.push({ role: 'assistant', content: finalParsed.reply });

    const switchSubjectKey = SUBJECT_LABEL_TO_KEY[finalParsed.detected_subject] ||
      (finalParsed.selected_subject ? SUBJECT_LABEL_TO_KEY[finalParsed.selected_subject] : null);
    if (switchSubjectKey && switchSubjectKey !== subject) {
      setSubject(switchSubjectKey);
      setSubjectAlert(finalParsed);
    } else if (finalParsed.should_switch_subject && switchSubjectKey) {
      setSubject(switchSubjectKey);
      setSubjectAlert(finalParsed);
    }

    setCurrentResponse(finalParsed);
    setLocalStepIndex(finalParsed.visual?.stepIndex ?? 0);

    setMessages((prev) => {
      const withoutLoading = prev.filter((m) => !m.loading);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: finalParsed!.reply,
        createdAt: Date.now(),
        isFallback: wasApiError,
        response: finalParsed!,
      };
      return [...withoutLoading, assistantMsg];
    });

    setSessionState((prev) => {
      const vType = finalParsed!.visual?.type || 'none';
      const isNewTopic = !prev || !prev.sessionId ||
        (finalParsed!.detected_topic && finalParsed!.detected_topic !== '通用问题' && finalParsed!.detected_topic !== prev.topic) ||
        (finalParsed!.visual?.type && finalParsed!.visual.type !== 'none' && finalParsed!.visual.type !== prev.visualType);

      if (isNewTopic) {
        return createTutoringSession(
          finalParsed!.detected_subject || SubjectLabels[subject],
          GradeLabels[grade] || grade,
          finalParsed!.detected_topic || '',
          vType,
        );
      }

      const updated = { ...prev };
      updated.visualType = vType;
      if (finalParsed!.detected_topic && finalParsed!.detected_topic !== '通用问题') {
        updated.topic = finalParsed!.detected_topic;
      }
      updated.lastQuestion = finalParsed!.question_to_student || '';
      updated.expectedStudentAnswer = finalParsed!.expected_student_answer || '';
      updated.studentAnswers = [...updated.studentAnswers, text];
      updated.hintLevel = finalParsed!.hint_level ?? updated.hintLevel;

      if (finalParsed!.misconception_check && finalParsed!.misconception_check.length > 0) {
        updated.misconceptionFlags = [
          ...new Set([...updated.misconceptionFlags, ...finalParsed!.misconception_check]),
        ];
      }

      if (finalParsed!.next_action === 'advance_step') {
        updated.currentStep = finalParsed!.current_step > prev.currentStep
          ? Math.min(finalParsed!.current_step, prev.maxStep)
          : Math.min(prev.currentStep + 1, prev.maxStep);
      } else if (finalParsed!.next_action === 'show_hint') {
        updated.hintLevel = Math.min(3, (updated.hintLevel || 0) + 1);
        if (finalParsed!.current_step > prev.currentStep) {
          updated.currentStep = Math.min(finalParsed!.current_step, prev.maxStep);
        }
      } else {
        if (finalParsed!.current_step && finalParsed!.current_step !== prev.currentStep) {
          updated.currentStep = Math.min(finalParsed!.current_step, prev.maxStep);
        }
      }

      return updated;
    });

    setIsStreaming(false);
  }, [inputText, isStreaming, subject, grade, model, sessionState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const handleClear = () => {
    if (confirm('确定清空所有对话？')) {
      setCurrentResponse(null);
      conversationHistoryRef.current = [];
      setSubjectAlert(null);
      setLocalStepIndex(0);
      setSessionState(null);
      setMessages([]);
      setUsedFallback(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setInputText(q);
    setSidebarOpen(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleStepPrev = () => {
    setLocalStepIndex((s) => Math.max(0, s - 1));
  };

  const handleStepNext = () => {
    const maxStep = currentResponse?.visual?.type
      ? (VISUAL_MAX_STEPS[currentResponse.visual.type] || 10)
      : 10;
    setLocalStepIndex((s) => Math.min(maxStep, s + 1));
  };

  const headerSubject = SUBJECTS.find((s) => s.key === subject);
  const headerGrade = GradeLabels[grade] || '初一';
  const hasVisual = currentResponse?.visual && currentResponse.visual.type !== 'none';

  return (
    <div className="app">
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">AI智学助手</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <div className="sidebar-section">
          <h3 className="section-title">📚 学科</h3>
          <div className="subject-grid">
            {SUBJECTS.map((s) => (
              <button
                key={s.key}
                className={`subject-btn${subject === s.key ? ' active' : ''}`}
                onClick={() => setSubject(s.key)}
              >
                <span className="subject-icon">{s.icon}</span>
                <span className="subject-name">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="section-title">🎯 年级</h3>
          <div className="grade-list">
            {GRADES.map((group) => (
              <div className="grade-group" key={group.label}>
                <span className="grade-label">{group.label}</span>
                <div className="grade-btns">
                  {group.items.map((g) => (
                    <button
                      key={g.key}
                      className={`grade-btn${grade === g.key ? ' active' : ''}`}
                      onClick={() => setGrade(g.key)}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="section-title">🤖 模型</h3>
          <div className="model-toggle">
            {MODELS.map((m) => (
              <button
                key={m.key}
                className={`model-btn${model === m.key ? ' active' : ''}`}
                onClick={() => setModel(m.key)}
              >
                <span className="model-dot" />
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="section-title">💡 试试这些</h3>
          <div className="quick-questions">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q.q} className="quick-q" onClick={() => handleQuickQuestion(q.q)}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="main">
        {subjectAlert && (
          <div className="subject-switch-alert">
            <span className="alert-icon">🔄</span>
            <span className="alert-text">
              已识别为【{subjectAlert.detected_subject} / {subjectAlert.detected_topic}】，已自动切换。
            </span>
            <button className="alert-close" onClick={() => setSubjectAlert(null)}>✕</button>
          </div>
        )}

        <div className="whiteboard-area">
          {!currentResponse && !isStreaming && (
            <div className="whiteboard-empty">
              <div className="empty-icon">🎓</div>
              <h2 className="empty-title">AI智学助手</h2>
              <p className="empty-desc">
                我会引导你思考，而不是直接给答案。
                <br />
                选择学科和年级，输入你的问题开始探索！
              </p>
              <div className="empty-features">
                <div className="feature-chip">🧠 引导式思考</div>
                <div className="feature-chip">📊 图形化讲解</div>
                <div className="feature-chip">📚 全学科覆盖</div>
              </div>
            </div>
          )}

          {isStreaming && !currentResponse && (
            <div className="whiteboard-loading">
              <div className="loading-spinner" />
              <p className="loading-text">AI 正在思考...</p>
            </div>
          )}

          {currentResponse && (
            <div className="whiteboard-content">
              <div className="whiteboard-header">
                <div className="whiteboard-title-row">
                  <span className="wb-subject-tag">{headerSubject?.icon} {headerSubject?.name}</span>
                  <span className="wb-grade-tag">{headerGrade}</span>
                  {currentResponse.detected_topic && currentResponse.detected_topic !== '通用问题' && currentResponse.detected_topic !== '未知' && (
                    <span className="wb-topic-tag">{currentResponse.detected_topic}</span>
                  )}
                </div>
                <div className="whiteboard-step-row">
                  <span className="wb-step-label">步骤 {localStepIndex + 1}</span>
                </div>
              </div>

              {hasVisual && (
                <div className="whiteboard-visual">
                  <VisualRenderer
                    visual={{ ...currentResponse.visual!, stepIndex: localStepIndex }}
                  />
                </div>
              )}

              {!hasVisual && currentResponse && (
                <div className="whiteboard-text-card">
                  <div className="text-card-topic">{currentResponse.detected_topic && currentResponse.detected_topic !== '通用问题' && currentResponse.detected_topic !== '未知' ? currentResponse.detected_topic : '待识别问题'}</div>
                  <div className="text-card-guide">{currentResponse.reply}</div>
                  {currentResponse.question_to_student && (
                    <div className="text-card-question">
                      <span className="tcq-label">💭 思考</span>
                      <span className="tcq-text">{currentResponse.question_to_student}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="whiteboard-controls">
                <button
                  className="step-btn"
                  onClick={handleStepPrev}
                  disabled={localStepIndex <= 0}
                >
                  ← 上一步
                </button>
                <span className="step-indicator">
                  步骤 {localStepIndex + 1}
                </span>
                <button className="step-btn" onClick={handleStepNext}>
                  下一步 →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="right-panel">
          <div className="panel-header">
            <span className="panel-header-icon">🤖</span>
            <span className="panel-header-title">AI 家教</span>
            {usedFallback && (
              <span className="fallback-badge">本地模式</span>
            )}
            <button className="clear-btn" onClick={handleClear} title="清空对话">
              🗑️
            </button>
          </div>

          <div className="panel-body">
            {messages.length === 0 && (
              <div className="panel-placeholder">
                <p>输入你的问题，AI 会引导你一步步思考</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.role}`}>
                {msg.role === 'user' ? (
                  <div className="msg-bubble user-bubble">{msg.content}</div>
                ) : msg.loading ? (
                  <div className="msg-bubble assistant-bubble loading-bubble">
                    <div className="typing-indicator">
                      <span /><span /><span />
                    </div>
                  </div>
                ) : (
                  <div className="msg-bubble assistant-bubble">
                    {msg.isFallback && (
                      <div className="fallback-hint">当前使用本地 fallback，真实 API 未连通。</div>
                    )}
                    <div className="ai-reply-text">{msg.content}</div>
                    {msg.response?.question_to_student && (
                      <div className="ai-question-inline">
                        <span className="aq-label">💭 思考</span>
                        <span className="aq-text">{msg.response.question_to_student}</span>
                      </div>
                    )}
                    {msg.response?.misconception_check && msg.response.misconception_check.length > 0 && (
                      <div className="ai-misconception-inline">
                        ⚠️ {msg.response.misconception_check.join('、')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="panel-input">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入你的回答..."
                rows={1}
              />
              <button
                className="send-btn"
                disabled={!inputText.trim() || isStreaming}
                onClick={sendMessage}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
        ☰
      </button>

      {sidebarOpen && <div className="overlay active" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
