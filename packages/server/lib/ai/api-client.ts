import { ModelConfig } from './models';

// 通用API响应类型
export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  model?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// DeepSeek缓存参数
interface DeepSeekCacheOptions {
  enableCache?: boolean;        // 是否启用缓存
  cacheScope?: 'user' | 'org';  // 缓存范围（用户或组织）
  cacheId?: string;             // 缓存ID标识
}

// 公共模型调用参数
export interface ModelCallOptions {
  model: ModelConfig;
  prompt: string;
  imageBase64?: string;
  maxTokens?: number;
  cacheOptions?: DeepSeekCacheOptions;
  userId?: string;
}

/**
 * 根据不同的模型提供商调用相应的API
 */
export async function callModelApi(options: ModelCallOptions): Promise<ApiResponse> {
  const { model, prompt, imageBase64, maxTokens, cacheOptions, userId } = options;
  
  // 设置最大token数
  const actualMaxTokens = maxTokens || (model.maxResponseTokens > 100 ? 100 : model.maxResponseTokens);
  
  try {
    // 根据模型提供商分发到相应的API调用函数
    if (model.provider === 'openai') {
      return await callOpenAiApi(model, prompt, imageBase64, actualMaxTokens);
    } else if (model.provider === 'google') {
      return await callGoogleApi(model, prompt, imageBase64, actualMaxTokens);
    } else if (model.provider === 'deepseek') {
      return await callDeepSeekApi(model, prompt, imageBase64, actualMaxTokens, cacheOptions, userId);
    } else {
      return {
        success: false,
        error: `不支持的模型提供商: ${model.provider}`
      };
    }
  } catch (error) {
    console.error(`调用${model.name} API出错:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      model: model.id
    };
  }
}

/**
 * 调用OpenAI API
 */
async function callOpenAiApi(
  model: ModelConfig, 
  prompt: string, 
  imageBase64?: string,
  maxTokens?: number
): Promise<ApiResponse> {
  const apiKey = process.env[model.apiKeyEnvVar];
  if (!apiKey) {
    return {
      success: false,
      error: `缺少${model.name}所需的API密钥`
    };
  }
  
  const apiEndpoint = model.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
  
  // 构建消息内容
  let content: any;
  if (imageBase64 && model.visionSupport) {
    content = [
      {
        type: "text",
        text: prompt
      },
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      }
    ];
  } else {
    content = prompt;
  }
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        {
          role: "user",
          content
        }
      ],
      max_tokens: maxTokens
    })
  });
  
  const data = await response.json();
  
  // 检查API是否返回错误
  if (data.error) {
    return {
      success: false,
      error: `OpenAI API错误: ${data.error.message || '未知错误'}`,
      model: model.id
    };
  }
  
  // 解析结果
  const result = data.choices?.[0]?.message?.content || '';
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;
  
  return {
    success: true,
    data: result,
    model: model.id,
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    }
  };
}

/**
 * 调用Google Gemini API
 */
async function callGoogleApi(
  model: ModelConfig, 
  prompt: string, 
  imageBase64?: string,
  maxTokens?: number
): Promise<ApiResponse> {
  const apiKey = process.env[model.apiKeyEnvVar];
  if (!apiKey) {
    return {
      success: false,
      error: `缺少${model.name}所需的API密钥`
    };
  }
  
  const apiEndpoint = model.apiEndpoint || 
    `https://generativelanguage.googleapis.com/v1/models/${model.id}:generateContent?key=${apiKey}`;
  
  // 构建请求体
  const parts = [];
  parts.push({ text: prompt });
  
  if (imageBase64 && model.visionSupport) {
    parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: imageBase64
      }
    });
  }
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens: maxTokens
      }
    })
  });
  
  const data = await response.json();
  
  // 检查API是否返回错误
  if (data.error) {
    return {
      success: false,
      error: `Google API错误: ${data.error.message || '未知错误'}`,
      model: model.id
    };
  }
  
  // 解析结果
  const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // Gemini可能不会直接返回token计数
  const promptTokens = data.usageMetadata?.promptTokenCount || 0;
  const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
  
  return {
    success: true,
    data: result,
    model: model.id,
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    }
  };
}

/**
 * 调用DeepSeek API，处理缓存特殊情况
 */
async function callDeepSeekApi(
  model: ModelConfig, 
  prompt: string, 
  imageBase64?: string,
  maxTokens?: number,
  cacheOptions?: DeepSeekCacheOptions,
  userId?: string
): Promise<ApiResponse> {
  const apiKey = process.env[model.apiKeyEnvVar];
  if (!apiKey) {
    return {
      success: false,
      error: `缺少${model.name}所需的API密钥`
    };
  }
  
  const apiEndpoint = model.apiEndpoint || 'https://api.deepseek.com/v1/chat/completions';
  
  // 构建消息内容
  let content: any;
  if (imageBase64 && model.visionSupport) {
    content = [
      {
        type: "text",
        text: prompt
      },
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      }
    ];
  } else {
    content = prompt;
  }
  
  // 构建请求体
  const requestBody: any = {
    model: model.id,
    messages: [
      {
        role: "user",
        content
      }
    ],
    max_tokens: maxTokens
  };
  
  // 处理缓存特殊情况
  if (model.supportsCaching && cacheOptions) {
    requestBody.cache_control = {
      enable_cache: cacheOptions.enableCache || model.hasCachedVersion,
      cache_scope: cacheOptions.cacheScope || 'user',
      cache_id: cacheOptions.cacheId || userId || undefined
    };
  }
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  const data = await response.json();
  
  // 检查API是否返回错误
  if (data.error) {
    return {
      success: false,
      error: `DeepSeek API错误: ${data.error.message || '未知错误'}`,
      model: model.id
    };
  }
  
  // 解析结果
  const result = data.choices?.[0]?.message?.content || '';
  // 获取token使用情况
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;
  
  // 检查是否命中缓存
  const cacheHit = data.cache_status?.cache_hit || false;
  
  return {
    success: true,
    data: result,
    model: model.id,
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    },
    // 额外的缓存信息
    ...(model.supportsCaching ? {
      cacheInfo: {
        cacheHit,
        cacheId: data.cache_status?.cache_id
      }
    } : {})
  };
} 