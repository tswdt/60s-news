import { ChatMessage, TutoringResponse, createFallbackResponse, parseTutoringResponse } from '../../../shared/types/tutoring';

interface DeepSeekCallOptions {
  systemPrompt: string;
  conversationHistory: ChatMessage[];
  userMessage: string;
}

export async function callDeepSeek(options: DeepSeekCallOptions): Promise<TutoringResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  if (!apiKey) {
    return createFallbackResponse('DeepSeek API Key 未配置，请在云函数环境变量中设置 DEEPSEEK_API_KEY。');
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: options.systemPrompt },
    ...options.conversationHistory,
    { role: 'user', content: options.userMessage },
  ];

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json() as any;

    if (data.error) {
      console.error('[DeepSeek] API error:', JSON.stringify(data.error));
      return createFallbackResponse('DeepSeek 服务返回错误，请稍后再试。');
    }

    const raw = data.choices?.[0]?.message?.content || '';
    console.log('[DeepSeek] raw response length:', raw.length);

    return parseTutoringResponse(raw);
  } catch (error: any) {
    console.error('[DeepSeek] call failed:', error.message);
    return createFallbackResponse('DeepSeek 服务暂时不可用，请稍后再试。');
  }
}
