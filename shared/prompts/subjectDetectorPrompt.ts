import { Subject, Grade, SubjectLabels, GradeLabels } from '../types/tutoring';

export const subjectDetectorPrompt = `你是一个学科和知识点识别助手。根据学生输入的问题，识别出最相关的学科、年级和知识点。

你必须以严格的 JSON 格式回复，不要输出任何其他内容：
{
  "subject": "学科代码",
  "grade": "年级代码",
  "knowledgePoints": ["知识点1", "知识点2"],
  "confidence": 0.95
}

学科代码对照：
- 数学: math
- 语文: chinese
- 英语: english
- 物理: physics
- 化学: chemistry
- 历史: history
- 生物: biology
- 地理: geography
- 政治: politics
- 几何: geometry

年级代码对照：
- 小学1-6年级: "1" ~ "6"
- 初一~初三: "7" ~ "9"
- 高一~高三: "10" ~ "12"

confidence 取值 0~1，表示识别的置信度。

示例输入："为什么负负得正？"
示例输出：
{"subject":"math","grade":"7","knowledgePoints":["有理数乘法","负数运算"],"confidence":0.9}

示例输入："光合作用的方程式是什么？"
示例输出：
{"subject":"biology","grade":"8","knowledgePoints":["光合作用","生物化学反应"],"confidence":0.95}`;

export interface DetectSubjectResult {
  subject: Subject;
  grade: Grade;
  knowledgePoints: string[];
  confidence: number;
}

export function parseDetectResult(raw: string): DetectSubjectResult | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      subject: parsed.subject || 'math',
      grade: parsed.grade || '7',
      knowledgePoints: parsed.knowledgePoints || [],
      confidence: parsed.confidence || 0.5,
    };
  } catch {
    return null;
  }
}
