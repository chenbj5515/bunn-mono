// 添加以下辅助函数
import { generateText } from './api';

// 共享工具函数
/**
 * 向Chrome扩展发送消息
 * @param type 消息类型
 * @param payload 消息负载数据
 * @returns Chrome消息发送结果
 */
export const sendMessage = (type: string, payload: any) => {
  return chrome.runtime.sendMessage({ type, payload });
};

/**
 * 获取API配置信息
 * @returns 包含apiKey和endpoint的配置对象
 */
export const getApiConfig = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'endpoint'], (result) => {
      resolve({
        apiKey: result.apiKey || '',
        endpoint: result.endpoint || '',
      });
    });
  });
};

/**
 * 生成唯一标识符
 * @param prefix 可选前缀
 * @returns 唯一标识符字符串
 */
export function generateUniqueId(prefix: string = 'trans'): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${timestamp}-${randomPart}`;
}

/**
 * 检测文本是否为中文
 * @param text 要检测的文本
 * @returns 是否为中文文本
 */
export function isChineseText(text: string): boolean {
  // 检测是否包含中文特有的标点符号
  const chinesePunctuation = /[\u3000-\u303F]|[\uFF00-\uFFEF]/;

  // 检测是否只包含汉字、中文标点和常用符号
  const chineseOnly = /^[\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF\s，。！？、：；""''（）]+$/;

  // 检测是否包含日文特有的假名字符
  const hasJapanese = /[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF66-\uFF9F]/;

  // 如果包含假名，则不认为是中文
  if (hasJapanese.test(text)) {
    return false;
  }

  // 如果包含中文标点且只包含汉字和中文标点，则认为是中文
  return chinesePunctuation.test(text) && chineseOnly.test(text);
}

/**
 * 检测文本是否包含日语
 * @param text 要检测的文本
 * @returns 是否包含日语
 */
export function isJapaneseText(text: string): boolean {
  // 检测是否包含汉字
  return /[\u4E00-\u9FFF]/.test(text);
}

/**
 * 为日语汉字添加平假名注音
 * @param text 日语文本
 * @returns 带有平假名注音的HTML
 */
export async function addRubyForJapanese(text: string): Promise<string> {
  // 如果文本中没有汉字，则直接返回原文本
  if (!/[\u4E00-\u9FFF]/.test(text)) {
    return text;
  }

  try {
    // 使用OpenAI API获取汉字的平假名读音
    const prompt = `
      请将以下日语文本中的汉字转换为带有平假名注音的形式。
      请使用HTML的ruby标签格式，例如：<ruby>日<rt>に</rt></ruby><ruby>本<rt>ほん</rt></ruby><ruby>語<rt>ご</rt></ruby>
      对于已经是平假名或片假名的部分，不需要添加ruby标签，保持原样即可。
      只返回转换后的HTML，不要添加任何解释或其他内容。

      文本: ${text}
    `;

    const generatedText = await generateText(prompt);

    // 清理可能的前缀和后缀文本
    let cleanResult = generatedText?.trim();

    // 如果AI返回了带有代码块的回答，提取代码块内容
    if (cleanResult.includes('```html')) {
      cleanResult = cleanResult.split('```html')[1].split('```')[0].trim();
    } else if (cleanResult.includes('```')) {
      cleanResult = cleanResult.split('```')[1].split('```')[0].trim();
    }

    // 添加样式，使rt标签更美观
    const styledResult = cleanResult.replace(/<rt>/g, '<rt style="font-size: 0.7em; line-height: 1; color: #666;">');

    return styledResult;
  } catch (error) {
    console.error('获取平假名注音时出错:', error);
    return text; // 出错时返回原文本
  }
}