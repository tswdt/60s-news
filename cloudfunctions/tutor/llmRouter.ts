import { ModelProvider, TutoringResponse, ChatMessage } from '../../../shared/types/tutoring';
import { callDeepSeek } from './providers/deepseek';
import { callQwen } from './providers/qwen';
import { buildTutorSystemPrompt } from './prompts/tutorSystemPrompt';

interface LLMRouterOptions {
  modelProvider: ModelProvider;
  selectedSubject: any;
  selectedGrade: any;
  conversationHistory: ChatMessage[];
  userMessage: string;
  currentStep: number;
}

export async function llmRouter(options: LLMRouterOptions): Promise<TutoringResponse> {
  const systemPrompt = buildTutorSystemPrompt(
    options.selectedGrade,
    options.selectedSubject,
    options.currentStep,
  );

  const callOptions = {
    systemPrompt,
    conversationHistory: options.conversationHistory,
    userMessage: options.userMessage,
  };

  switch (options.modelProvider) {
    case 'deepseek':
      console.log('[LLMRouter] routing to DeepSeek');
      return callDeepSeek(callOptions);

    case 'qwen':
      console.log('[LLMRouter] routing to Qwen');
      return callQwen(callOptions);

    case 'qwen-vl':
      console.log('[LLMRouter] routing to Qwen-VL (vision)');
      return callQwen({ ...callOptions, useVision: true });

    default:
      console.warn('[LLMRouter] unknown provider, fallback to DeepSeek:', options.modelProvider);
      return callDeepSeek(callOptions);
  }
}
