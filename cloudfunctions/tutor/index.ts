import * as cloud from 'wx-server-sdk';
import { TutorCloudRequest, TutorCloudResult, TutoringResponse } from '../../shared/types/tutoring';
import { llmRouter } from './llmRouter';

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event: TutorCloudRequest): Promise<TutorCloudResult> => {
  const {
    userMessage,
    selectedSubject,
    selectedGrade,
    conversationHistory,
    currentStep,
    modelProvider,
  } = event;

  if (!userMessage) {
    return {
      success: false,
      parsed: createLocalFallback('请输入你的问题。'),
      error: 'userMessage is required',
    };
  }

  const defaultProvider = process.env.DEFAULT_MODEL_PROVIDER || 'deepseek';
  const effectiveProvider = modelProvider || defaultProvider;

  console.log('[tutor] request:', JSON.stringify({
    userMessage: userMessage.slice(0, 100),
    selectedSubject,
    selectedGrade,
    currentStep,
    modelProvider: effectiveProvider,
    historyLength: conversationHistory?.length || 0,
  }));

  try {
    const parsed: TutoringResponse = await llmRouter({
      modelProvider: effectiveProvider as any,
      selectedSubject: selectedSubject || 'math',
      selectedGrade: selectedGrade || '7',
      conversationHistory: conversationHistory || [],
      userMessage,
      currentStep: currentStep || 1,
    });

    console.log('[tutor] response:', JSON.stringify({
      detected_subject: parsed.detected_subject,
      detected_topic: parsed.detected_topic,
      teaching_mode: parsed.teaching_mode,
      visual_type: parsed.visual.type,
      next_action: parsed.next_action,
    }));

    return { success: true, parsed };
  } catch (error: any) {
    console.error('[tutor] fatal error:', error.message);
    return {
      success: false,
      parsed: createLocalFallback('AI 辅导服务暂时不可用，请稍后再试。'),
      error: error.message,
    };
  }
}

function createLocalFallback(reply: string): TutoringResponse {
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
