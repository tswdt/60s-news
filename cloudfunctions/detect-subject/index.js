const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const { subjectDetectorPrompt, parseDetectResult } = require('../../shared/prompts/subjectDetectorPrompt');

exports.main = async (event) => {
  const { text } = event;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
  const modelName = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: subjectDetectorPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const result = parseDetectResult(raw);

    if (result) {
      return { success: true, ...result };
    }

    return {
      success: true,
      subject: 'math',
      grade: '7',
      knowledgePoints: [],
      confidence: 0,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
