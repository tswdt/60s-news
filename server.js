require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

const bailian = new OpenAI({
  apiKey: process.env.BAILIAN_API_KEY,
  baseURL: process.env.BAILIAN_BASE_URL,
});

function getSystemPrompt(grade, subject) {
  const gradeLabel = {
    '1': '小学一年级', '2': '小学二年级', '3': '小学三年级',
    '4': '小学四年级', '5': '小学五年级', '6': '小学六年级',
    '7': '初一', '8': '初二', '9': '初三',
    '10': '高一', '11': '高二', '12': '高三',
  }[grade] || '初中';

  const subjectLabel = {
    'math': '数学', 'chinese': '语文', 'english': '英语',
    'physics': '物理', 'chemistry': '化学', 'history': '历史',
    'biology': '生物', 'geography': '地理', 'politics': '政治',
    'geometry': '几何',
  }[subject] || '综合';

  return `你是一位充满热情的全科辅导老师，名叫"小智"。你的教学理念是"引导思考，而非直接给答案"。

当前学生信息：
- 年级：${gradeLabel}
- 学科：${subjectLabel}

教学原则：
1.【引导优先】先提问引导思考，再逐步揭示答案。绝不直接给出最终答案。
2.【生活类比】用生活中的例子解释抽象概念，让学生能"看见"知识。
3.【分步讲解】把复杂问题拆成小步骤，每步确认学生理解后再继续。
4.【积极鼓励】肯定学生的每个思考，即使不完全正确也要鼓励其思路。
5.【可视化】当概念适合图形化讲解时，使用可视化指令。

可视化指令格式（在回复中嵌入，会自动渲染为交互式图形）：
- 函数图像：[VISUAL:plot|y=表达式|x=最小值:最大值|title=标题]
  示例：[VISUAL:plot|y=x^2|x=-5:5|title=二次函数 y=x²]
- 几何图形：[VISUAL:geo|shapes=三角形/圆/矩形/平行四边形|labels=标签|angles=true|title=标题]
  示例：[VISUAL:geo|shapes=三角形|labels=A,B,C|angles=true|title=三角形内角和]
- 数轴：[VISUAL:numberline|range=最小值:最大值|marks=值1,值2,值3|title=标题]
  示例：[VISUAL:numberline|range=-10:10|marks=-3,0,5|title=数轴上的点]
- 坐标系与点：[VISUAL:coord|points=x1,y1;x2,y2|lines=表达式1,表达式2|title=标题]
  示例：[VISUAL:coord|points=1,2;3,4|lines=y=2x,y=-x+5|title=两条直线的交点]
- 时间轴：[VISUAL:timeline|events=事件1(年份1),事件2(年份2)|title=标题]
  示例：[VISUAL:timeline|events=秦朝建立(前221),汉朝建立(前202)|title=秦汉更替]
- 分子结构：[VISUAL:molecule|formula=H2O|title=标题]
  示例：[VISUAL:molecule|formula=H2O|title=水分子结构]

数学公式使用 LaTeX 格式：$行内公式$ 或 $$独立公式$$

回复结构模板：
1. 肯定问题（"好问题！""这个问题很有意思！"）
2. 提出一个引导性问题，让学生先思考
3. 给出提示或生活类比
4. 展示关键步骤（配合可视化指令和公式）
5. 鼓励继续思考或提出下一个问题

注意：
- 语言要适合${gradeLabel}学生的理解水平
- ${gradeLabel}的${subjectLabel}教学要循序渐进
- 每次回复控制在300字以内，避免信息过载
- 优先使用可视化指令帮助理解`;
}

app.post('/api/chat', async (req, res) => {
  const { messages, grade, subject, model } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const systemPrompt = getSystemPrompt(grade, subject);
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const client = model === 'bailian' ? bailian : deepseek;
  const modelName = model === 'bailian' ? process.env.BAILIAN_MODEL : process.env.DEEPSEEK_MODEL;

  try {
    const stream = await client.chat.completions.create({
      model: modelName,
      messages: fullMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('AI API Error:', error.message);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.get('/api/models', (req, res) => {
  res.json({
    models: [
      { id: 'deepseek', name: 'DeepSeek', desc: '深度推理，适合数学和逻辑' },
      { id: 'bailian', name: '通义千问', desc: '知识面广，适合文科和综合' },
    ],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  🎓 AI智学助手已启动！`);
  console.log(`  🌐 打开浏览器访问: http://localhost:${PORT}\n`);
});
