require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'placeholder',
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
});

const qwen = new OpenAI({
  apiKey: process.env.QWEN_API_KEY || process.env.BAILIAN_API_KEY || 'placeholder',
  baseURL: process.env.QWEN_BASE_URL || process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const QWEN_MODEL = process.env.QWEN_MODEL || process.env.BAILIAN_MODEL || 'qwen-plus';

const GradeLabels = {
  '1': '小学一年级', '2': '小学二年级', '3': '小学三年级',
  '4': '小学四年级', '5': '小学五年级', '6': '小学六年级',
  '7': '初一', '8': '初二', '9': '初三',
  '10': '高一', '11': '高二', '12': '高三',
};

const SubjectLabels = {
  math: '数学', chinese: '语文', english: '英语',
  physics: '物理', chemistry: '化学', history: '历史',
  biology: '生物', geography: '地理', politics: '政治',
  geometry: '几何',
};

const validVisualTypes = [
  'triangle_angle_sum_parallel', 'rectangle_grid', 'number_line',
  'fraction_bar', 'balance_scale', 'geometry_canvas',
  'timeline', 'cause_effect_graph', 'chem_particle',
  'force_diagram', 'none',
];

const validTeachingModes = ['socratic_visual', 'explanation', 'practice', 'diagnosis'];
const validNextActions = ['wait_student_answer', 'show_hint', 'advance_step', 'give_summary'];

function buildTutorSystemPrompt(grade, subject, currentStep) {
  const gradeLabel = GradeLabels[grade] || '初中';
  const subjectLabel = SubjectLabels[subject] || '综合';
  const step = currentStep || 1;

  return `你是一个 K12 图形化教学智能体，名叫"小智"。

你的目标不是直接给答案，而是通过图形、分步追问、提示和纠错，引导学生自己理解。

当前学生信息：
- 年级：${gradeLabel}
- 学科：${subjectLabel}
- 当前教学步骤：第 ${step} 步

【每轮只做三件事 - 这是最重要的规则】
1. reply：一句简短引导（不超过 80 字，只说当前步骤需要学生注意的事）
2. visual：一个可视化步骤（设置 visual.stepIndex 指向当前步骤）
3. question_to_student：只提一个问题（不超过 40 字，只问一个明确的点）

【绝对禁止 - 违反任何一条都算严重错误】
- 禁止一次性给出完整证明或完整答案
- 禁止一次列出多个步骤
- 禁止长篇鼓励（如"你真棒！继续加油！你能做到的！"）
- 禁止长篇总结（总结最多一句话）
- 禁止连问多个问题（question_to_student 只能有一个问号）
- 禁止在 reply 中重复 question_to_student 的内容
- 禁止输出 Markdown（不要 **加粗**、*斜体*、#标题、-列表、>引用、\`代码\`）
- 禁止输出 HTML（不要 <div>、<span>、<table> 等任何标签）
- 禁止输出 SVG（不要 <svg>、<path> 等）
- 禁止输出 Mermaid（不要 graph TD、sequenceDiagram 等）
- 禁止在 JSON 之外输出任何文字

【长度硬限制】
- reply：不超过 80 个汉字
- question_to_student：不超过 40 个汉字，只能包含一个问号
- 如果内容超出限制，必须精简，而不是分段输出

【可用 visual.type】
- triangle_angle_sum_parallel：三角形内角和证明（平行线辅助线）
- rectangle_grid：长方形面积、乘法阵列
- number_line：数轴、加减法、负数、分数
- fraction_bar：分数理解、分数比较
- balance_scale：方程、等式
- geometry_canvas：一般几何图形（三角形、圆、四边形等）
- timeline：历史时间轴
- cause_effect_graph：历史因果链
- chem_particle：化学粒子模型、分子结构
- force_diagram：物理受力图
- none：不需要图形

【强制 visual 映射规则】
- 学生问"三角形内角和为什么是180度" → 必须使用 triangle_angle_sum_parallel
- 学生问"长方形面积怎么算" → 必须使用 rectangle_grid
- 学生问"方程怎么解" → 必须使用 balance_scale
- 学生问"分数是什么" → 必须使用 fraction_bar
- 学生问"负数是什么" → 必须使用 number_line
- 学生问历史事件 → 必须使用 timeline
- 学生问化学反应 → 必须使用 chem_particle
- 学生问物理受力 → 必须使用 force_diagram
- 学生问"唐朝为什么那么强大"或"唐朝强盛"或"盛唐" → 必须使用 cause_effect_graph，detected_topic 必须为"唐朝强盛原因"
- 学生问历史因果分析 → 必须使用 cause_effect_graph

【返回 JSON 格式 - 必须严格遵循】
{
  "detected_subject": "学科中文名",
  "detected_topic": "知识点名称",
  "detected_grade": "年级中文名",
  "should_switch_subject": false,
  "teaching_mode": "教学模式",
  "current_step": 1,
  "reply": "简短引导，不超过80字",
  "question_to_student": "一个问题，不超过40字",
  "visual": {
    "type": "可视化类型代码",
    "stepIndex": 1,
    "data": {}
  },
  "expected_student_answer": "期望学生回答的参考答案",
  "misconception_check": ["可能的误解1", "可能的误解2"],
  "hint_level": 0,
  "next_action": "下一步动作"
}

【字段取值范围】
detected_subject：数学、语文、英语、物理、化学、历史、生物、地理、政治、几何
detected_grade：小学一年级~六年级、初一~初三、高一~高三
teaching_mode：必须是以下之一
  - socratic_visual：苏格拉底式引导+可视化（默认，优先使用）
  - explanation：直接讲解（仅当学生明确要求"直接告诉我"时使用）
  - practice：出题练习
  - diagnosis：诊断误解
visual.type：必须是上文列出的可用类型之一
next_action：必须是以下之一
  - wait_student_answer：等待学生回答（默认）
  - show_hint：给出提示
  - advance_step：进入下一步
  - give_summary：给出总结
hint_level：0~3
  - 0：无提示
  - 1：轻微提示（方向性）
  - 2：中等提示（关键信息）
  - 3：强提示（接近答案）

【教学策略】
- 首次提问：teaching_mode="socratic_visual"，current_step=${step}，next_action="wait_student_answer"
- 学生回答正确：current_step+1，next_action="advance_step"，简短肯定（如"对！"）
- 学生回答部分正确：hint_level+1，next_action="show_hint"，指出正确部分
- 学生回答错误：misconception_check 填入可能的误解，next_action="show_hint"，不要批评
- 学生回答"不知道""不会""不清楚"：绝对不能要求学生重新描述问题！必须：hint_level+1，next_action="show_hint"，给出更具体的提示，保持当前topic不变，visual保持当前类型
- 知识点讲解完毕：next_action="give_summary"，teaching_mode="explanation"
- 学生要求练习：teaching_mode="practice"

【示例 - 学生问"三角形内角和为什么是180度"】
{
  "detected_subject": "几何",
  "detected_topic": "三角形内角和",
  "detected_grade": "${gradeLabel}",
  "should_switch_subject": false,
  "teaching_mode": "socratic_visual",
  "current_step": 1,
  "reply": "看图，我过顶点 A 画了一条和 BC 平行的直线。",
  "question_to_student": "平行线被截开时，内错角有什么关系？",
  "visual": {
    "type": "triangle_angle_sum_parallel",
    "stepIndex": 1,
    "data": { "showParallel": true, "highlightAngle": "A" }
  },
  "expected_student_answer": "内错角相等",
  "misconception_check": ["把结论当原因", "不知道内错角相等"],
  "hint_level": 0,
  "next_action": "wait_student_answer"
}

记住：你只能输出 JSON，不能输出任何其他内容。不要在 JSON 前后添加任何文字。`;
}

function createFallbackResponse(reply) {
  return {
    detected_subject: '数学',
    detected_topic: '未知',
    detected_grade: '初一',
    teaching_mode: 'explanation',
    current_step: 1,
    reply,
    question_to_student: '你还有什么不明白的地方吗？',
    visual: { type: 'none', stepIndex: 0 },
    hint_level: 0,
    next_action: 'wait_student_answer',
  };
}

function truncateByCharLen(str, maxLen) {
  if (!str) return str;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    count += str.charCodeAt(i) > 127 ? 1 : 0.5;
    if (count > maxLen) return str.slice(0, i) + '…';
  }
  return str;
}

function extractFirstQuestion(str) {
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

function parseTutoringResponse(raw) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return createFallbackResponse(raw.slice(0, 500));
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

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
      detected_subject: String(parsed.detected_subject || '数学'),
      detected_topic: String(parsed.detected_topic || '未知'),
      detected_grade: String(parsed.detected_grade || '初一'),
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

function routeToClient(modelProvider) {
  if (modelProvider === 'qwen' || modelProvider === 'qwen-vl') {
    return { client: qwen, modelName: QWEN_MODEL };
  }
  return { client: deepseek, modelName: DEEPSEEK_MODEL };
}

function validateTutoringResponse(parsed) {
  const errors = [];

  if (!parsed.reply || parsed.reply.trim().length === 0) {
    errors.push('reply is empty');
  }

  if (!parsed.question_to_student || parsed.question_to_student.trim().length === 0) {
    errors.push('question_to_student is empty');
  }

  const replyCharLen = (parsed.reply || '').split('').reduce((s, c) => s + (c.charCodeAt(0) > 127 ? 1 : 0.5), 0);
  if (replyCharLen > 80) {
    errors.push('reply too long: ' + Math.round(replyCharLen) + ' chars (max 80)');
  }

  const qCharLen = (parsed.question_to_student || '').split('').reduce((s, c) => s + (c.charCodeAt(0) > 127 ? 1 : 0.5), 0);
  if (qCharLen > 40) {
    errors.push('question_to_student too long: ' + Math.round(qCharLen) + ' chars (max 40)');
  }

  const qText = parsed.question_to_student || '';
  const qCount = (qText.match(/[？?]/g) || []).length;
  if (qCount > 1) {
    errors.push('question_to_student has multiple questions: ' + qCount + ' question marks');
  }

  const mdPatterns = [/\*\*[^*]+\*\*/, /##?\s/, /^\s*-\s/m, /^\s*>\s/m, /`[^`]+`/];
  for (const pat of mdPatterns) {
    if (pat.test(parsed.reply)) {
      errors.push('reply contains Markdown: ' + pat.source);
      break;
    }
  }

  const htmlPattern = /<[a-zA-Z][^>]*>/;
  if (htmlPattern.test(parsed.reply)) {
    errors.push('reply contains HTML tags');
  }

  const svgPattern = /<svg[\s>]/i;
  if (svgPattern.test(parsed.reply)) {
    errors.push('reply contains SVG');
  }

  const mermaidPattern = /graph\s+(TD|LR|TB)|sequenceDiagram|flowchart/;
  if (mermaidPattern.test(parsed.reply)) {
    errors.push('reply contains Mermaid');
  }

  if (!validVisualTypes.includes(parsed.visual?.type)) {
    errors.push('visual.type is invalid: ' + parsed.visual?.type);
  }

  if (!validTeachingModes.includes(parsed.teaching_mode)) {
    errors.push('teaching_mode is invalid: ' + parsed.teaching_mode);
  }

  if (!validNextActions.includes(parsed.next_action)) {
    errors.push('next_action is invalid: ' + parsed.next_action);
  }

  if (typeof parsed.hint_level !== 'number' || parsed.hint_level < 0 || parsed.hint_level > 3) {
    errors.push('hint_level out of range: ' + parsed.hint_level);
  }

  return errors;
}

const VISUAL_MAX_STEPS = {
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

app.post('/api/tutor', async (req, res) => {
  const {
    userMessage,
    selectedSubject,
    selectedGrade,
    conversationHistory,
    currentStep,
    modelProvider,
    messages,
    grade,
    subject,
    model,
    sessionState,
  } = req.body;

  const effectiveGrade = selectedGrade || grade || '7';
  const effectiveSubject = selectedSubject || subject || 'math';
  const effectiveModelProvider = modelProvider || (model === 'bailian' ? 'qwen' : 'deepseek');

  let effectiveStep = currentStep || 1;
  let sessionContext = '';

  if (sessionState && sessionState.sessionId) {
    effectiveStep = sessionState.currentStep || 1;
    const maxStep = sessionState.maxStep || VISUAL_MAX_STEPS[sessionState.visualType] || 4;
    effectiveStep = Math.min(effectiveStep, maxStep);

    sessionContext = `

【当前教学会话状态 - 必须严格遵守】
- 会话ID：${sessionState.sessionId}
- 知识点：${sessionState.topic || '未知'}
- 可视化类型：${sessionState.visualType || 'none'}
- 当前步骤：第 ${effectiveStep} 步 / 共 ${maxStep} 步
- 上次提问：${sessionState.lastQuestion || '无'}
- 期望回答：${sessionState.expectedStudentAnswer || '无'}
- 学生已回答：${sessionState.studentAnswers ? sessionState.studentAnswers.length : 0} 次
- 已发现的误解：${sessionState.misconceptionFlags && sessionState.misconceptionFlags.length > 0 ? sessionState.misconceptionFlags.join('、') : '无'}

【步骤推进规则 - 必须严格遵守】
- 学生答对：设置 next_action="advance_step"，current_step=${effectiveStep}
- 学生答错：保持 current_step=${effectiveStep}，设置 next_action="show_hint"，hint_level 递增
- 学生回答不相关：保持 current_step=${effectiveStep}，重新提问 lastQuestion
- 当前已是第 ${maxStep} 步（最后一步）：设置 next_action="give_summary"
- visual.stepIndex 必须设为 ${effectiveStep}，不要跳步
- 不要从第1步重新开始，当前已经是第 ${effectiveStep} 步`;
  }

  const effectiveMessages = conversationHistory || messages || [];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const systemPrompt = buildTutorSystemPrompt(effectiveGrade, effectiveSubject, effectiveStep) + sessionContext;

  const userMsg = userMessage || effectiveMessages[effectiveMessages.length - 1]?.content || '';

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...effectiveMessages,
  ];

  if (userMsg && (!effectiveMessages.length || effectiveMessages[effectiveMessages.length - 1]?.role !== 'user')) {
    fullMessages.push({ role: 'user', content: userMsg });
  }

  const { client, modelName } = routeToClient(effectiveModelProvider);

  try {
    const stream = await client.chat.completions.create({
      model: modelName,
      messages: fullMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    let rawContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        rawContent += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    console.log('\n========== [DEBUG] Raw LLM Response ==========');
    console.log(rawContent);
    console.log('========== [DEBUG] End Raw Response ==========\n');

    const parsed = parseTutoringResponse(rawContent);

    if (sessionState && sessionState.sessionId) {
      const maxStep = sessionState.maxStep || VISUAL_MAX_STEPS[sessionState.visualType] || 4;
      if (parsed.current_step < effectiveStep) {
        parsed.current_step = effectiveStep;
      }
      if (parsed.current_step > maxStep) {
        parsed.current_step = maxStep;
      }
      if (parsed.visual.stepIndex < effectiveStep) {
        parsed.visual.stepIndex = effectiveStep;
      }
      if (parsed.visual.stepIndex > maxStep) {
        parsed.visual.stepIndex = maxStep;
      }
      if (parsed.next_action === 'advance_step') {
        parsed.current_step = effectiveStep;
        parsed.visual.stepIndex = effectiveStep;
      }
      if (effectiveStep >= maxStep && parsed.next_action !== 'give_summary') {
        parsed.next_action = 'give_summary';
      }
    }

    console.log('[DEBUG] Parsed TutoringResponse:', JSON.stringify(parsed, null, 2));

    const validationErrors = validateTutoringResponse(parsed);
    if (validationErrors.length > 0) {
      console.warn('[DEBUG] Validation warnings:', validationErrors);
    } else {
      console.log('[DEBUG] Validation: ALL PASSED ✓');
    }

    res.write(`data: ${JSON.stringify({ parsed })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('AI API Error:', error.message);
    const fallback = createFallbackResponse('抱歉，AI 服务暂时出了点问题，请稍后再试。');
    res.write(`data: ${JSON.stringify({ error: error.message, parsed: fallback })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

const subjectDetectorPrompt = `你是一个学科和知识点识别助手。根据学生输入的问题，识别出最相关的学科、年级和知识点。

你必须以严格的 JSON 格式回复，不要输出任何其他内容：
{
  "subject": "学科代码",
  "grade": "年级代码",
  "knowledgePoints": ["知识点1", "知识点2"],
  "confidence": 0.95
}

学科代码对照：
- 数学: math, 语文: chinese, 英语: english, 物理: physics, 化学: chemistry
- 历史: history, 生物: biology, 地理: geography, 政治: politics, 几何: geometry

年级代码：小学1-6年级: "1"~"6", 初一~初三: "7"~"9", 高一~高三: "10"~"12"
confidence 取值 0~1，表示识别的置信度。`;

app.post('/api/detect-subject', async (req, res) => {
  const { text } = req.body;

  try {
    const completion = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: subjectDetectorPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json({
        subject: parsed.subject || 'math',
        grade: parsed.grade || '7',
        knowledgePoints: parsed.knowledgePoints || [],
        confidence: parsed.confidence || 0.5,
      });
    } else {
      res.json({ subject: 'math', grade: '7', knowledgePoints: [], confidence: 0 });
    }
  } catch (error) {
    console.error('Detect subject error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/models', (req, res) => {
  res.json({
    models: [
      { id: 'deepseek', name: 'DeepSeek', desc: '深度推理，适合数学和逻辑' },
      { id: 'qwen', name: '通义千问', desc: '知识面广，适合文科和综合' },
    ],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  🎓 AI智学助手 (API Server) 已启动！`);
  console.log(`  🔌 API 地址: http://localhost:${PORT}/api\n`);
});
