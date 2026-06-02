import { ChatMessage, TutoringResponse, createFallbackResponse, parseTutoringResponse } from '../../../shared/types/tutoring';

interface QwenCallOptions {
  systemPrompt: string;
  conversationHistory: ChatMessage[];
  userMessage: string;
  useVision?: boolean;
}

export async function callQwen(options: QwenCallOptions): Promise<TutoringResponse> {
  const apiKey = process.env.QWEN_API_KEY;
  const baseURL = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const model = options.useVision
    ? (process.env.QWEN_VL_MODEL || 'qwen-vl-plus')
    : (process.env.QWEN_MODEL || 'qwen-plus');

  if (!apiKey) {
    return createFallbackResponse('Qwen API Key 未配置，请在云函数环境变量中设置 QWEN_API_KEY。');
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
      console.error('[Qwen] API error:', JSON.stringify(data.error));
      return createFallbackResponse('Qwen 服务返回错误，请稍后再试。');
    }

    const raw = data.choices?.[0]?.message?.content || '';
    console.log('[Qwen] raw response length:', raw.length);

    return parseTutoringResponse(raw);
  } catch (error: any) {
    console.error('[Qwen] call failed:', error.message);
    return createFallbackResponse('Qwen 服务暂时不可用，请稍后再试。');
  }
}
