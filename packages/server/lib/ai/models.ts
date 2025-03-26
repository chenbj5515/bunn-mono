// 模型配置类型定义
export interface ModelConfig {
  id: string;                  // 模型ID
  name: string;                // 模型显示名称
  provider: 'openai' | 'google' | 'deepseek'; // 提供商
  apiKeyEnvVar: string;        // 环境变量名，用于获取API密钥
  apiEndpoint?: string;        // 可选的API端点覆盖
  contextWindow: number;       // 上下文窗口大小（token数）
  maxResponseTokens: number;   // 最大响应token数
  visionSupport: boolean;      // 是否支持视觉功能
  costPerInputToken: number;   // 每输入token的成本（美分）
  costPerOutputToken: number;  // 每输出token的成本（美分）
  supportsCaching?: boolean;   // 是否支持缓存
  hasCachedVersion?: boolean;  // 是否有缓存版本
  cachedVersionId?: string;    // 缓存版本的ID
}

// 支持的AI模型配置
export const AI_MODELS: Record<string, ModelConfig> = {
  // OpenAI模型
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    contextWindow: 128000,
    maxResponseTokens: 4096,
    visionSupport: true,
    costPerInputToken: 0.005,
    costPerOutputToken: 0.015
  },
  
  // 4o 模型
  '4o-mini': {
    id: '4o-mini',
    name: '4o-mini',
    provider: 'openai', // 使用与OpenAI相同的provider处理逻辑
    apiKeyEnvVar: 'FOURTHBRAIN_API_KEY',
    apiEndpoint: 'https://api.4o.best/v1/chat/completions',
    contextWindow: 128000,
    maxResponseTokens: 4096,
    visionSupport: true,
    costPerInputToken: 0.0001, // 估算值
    costPerOutputToken: 0.0002  // 估算值
  },
  
  // DeepSeek模型 - 标准版和缓存版
  'deepseek-vision': {
    id: 'deepseek-vl-7b-chat',
    name: 'DeepSeek Vision',
    provider: 'deepseek',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    contextWindow: 4096,
    maxResponseTokens: 1024,
    visionSupport: true,
    costPerInputToken: 0.002,
    costPerOutputToken: 0.006,
    supportsCaching: true,
    hasCachedVersion: false,
    cachedVersionId: 'deepseek-vision-cached'
  },
  'deepseek-vision-cached': {
    id: 'deepseek-vl-7b-chat',
    name: 'DeepSeek Vision (缓存)',
    provider: 'deepseek',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    contextWindow: 4096,
    maxResponseTokens: 1024,
    visionSupport: true,
    costPerInputToken: 0.0005, // 缓存版本成本更低
    costPerOutputToken: 0.0015,
    supportsCaching: true,
    hasCachedVersion: true
  },
  'deepseek-coder': {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'deepseek',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    contextWindow: 8192,
    maxResponseTokens: 2048,
    visionSupport: false,
    costPerInputToken: 0.0015,
    costPerOutputToken: 0.0045,
    supportsCaching: true,
    hasCachedVersion: false,
    cachedVersionId: 'deepseek-coder-cached'
  },
  'deepseek-coder-cached': {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder (缓存)',
    provider: 'deepseek',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    contextWindow: 8192,
    maxResponseTokens: 2048,
    visionSupport: false,
    costPerInputToken: 0.0004, // 缓存版本成本更低
    costPerOutputToken: 0.0012,
    supportsCaching: true,
    hasCachedVersion: true
  }
};

// 默认使用的模型ID
export const DEFAULT_MODEL_ID = 'gpt-4o';

// 根据提供商获取模型
export function getModelsByProvider(provider: string): ModelConfig[] {
  return Object.values(AI_MODELS).filter(model => model.provider === provider);
}

// 获取支持视觉能力的模型
export function getVisionModels(): ModelConfig[] {
  return Object.values(AI_MODELS).filter(model => model.visionSupport);
}

// 获取支持缓存的模型
export function getCacheableModels(): ModelConfig[] {
  return Object.values(AI_MODELS).filter(model => model.supportsCaching && !model.hasCachedVersion);
}

// 获取缓存版本的模型
export function getCachedModels(): ModelConfig[] {
  return Object.values(AI_MODELS).filter(model => model.supportsCaching && model.hasCachedVersion);
}

// 获取模型的缓存版本
export function getCachedVersionOfModel(modelId: string): ModelConfig | undefined {
  const model = AI_MODELS[modelId];
  if (!model || !model.supportsCaching || !model.cachedVersionId) return undefined;
  return AI_MODELS[model.cachedVersionId];
}

// 检查模型是否受支持
export function isModelSupported(modelId: string): boolean {
  return !!AI_MODELS[modelId];
}

// 检查模型是否支持视觉功能
export function modelSupportsVision(modelId: string): boolean {
  return AI_MODELS[modelId]?.visionSupport || false;
} 