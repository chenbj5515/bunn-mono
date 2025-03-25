import { useState, useEffect } from 'react';

interface UseStreamFetchOptions {
  /**
   * 请求使用的模型，默认为gpt-4
   */
  model?: string;
  /**
   * 请求完成后的回调函数
   */
  onFinish?: (fullText: string) => void;
  /**
   * 发生错误时的回调函数
   */
  onError?: (error: Error) => void;
  /**
   * 每次收到新的文本块时触发的回调函数
   */
  onChunk?: (chunk: string, fullText: string) => void;
  /**
   * 流式API的端点URL，默认为'/api/openai/stream'
   */
  endpoint?: string;
  /**
   * 额外的请求参数，会被添加到URL查询字符串中
   */
  extraParams?: Record<string, string>;
  /**
   * 清理函数，在流结束或组件卸载时调用
   */
  cleanup?: () => void;
}

interface StreamFetchResult {
  /**
   * 流式响应累积的文本
   */
  text: string;
  /**
   * 是否正在加载中
   */
  isLoading: boolean;
  /**
   * 请求是否已完成
   */
  isFinished: boolean;
  /**
   * 错误信息
   */
  error: Error | null;
}

/**
 * 用于流式请求的自定义Hook
 */
export function useAIStream(
  prompt: string,
  options: UseStreamFetchOptions = {}
): StreamFetchResult {
  const { 
    model = 'gpt-4o',
    endpoint = '/api/openai/stream',
    onFinish, 
    onError, 
    onChunk,
    extraParams = {},
    cleanup
  } = options;

  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!prompt.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setText('');
    setIsFinished(false);

    const abortController = new AbortController();

    async function fetchStream() {
      try {
        // 构建URL
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.append('prompt', prompt);
        url.searchParams.append('model', model);
        
        // 添加额外参数
        Object.entries(extraParams).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });

        const response = await fetch(url, {
          signal: abortController.signal
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '请求失败');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              setIsFinished(true);
              setIsLoading(false);
              onFinish?.(text);
              cleanup?.();
              break;
            }
            
            const chunk = decoder.decode(value);
            const lines = chunk
              .split('\n\n')
              .filter(line => line.startsWith('data: '));
            
            for (const line of lines) {
              const data = line.replace('data: ', '');
              
              if (data === '[DONE]') {
                setIsFinished(true);
                setIsLoading(false);
                onFinish?.(text);
                cleanup?.();
                break;
              }
              
              try {
                const { delta } = JSON.parse(data);
                if (delta) {
                  const newText = text + delta;
                  setText(newText);
                  onChunk?.(delta, newText);
                }
              } catch (e) {
                console.error('解析响应数据失败', e);
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
        onError?.(errorObj);
        console.error('流式请求失败', errorObj);
      }
    }

    fetchStream();

    return () => {
      abortController.abort();
      cleanup?.();
    };
  }, []);

  return {
    text,
    isLoading,
    isFinished,
    error
  };
}

/**
 * 使用示例:
 * 
 * ```typescript
 * // 基本用法
 * function BasicExample() {
 *   const { text, isLoading, fetchStream } = useStreamFetch();
 *   
 *   useEffect(() => {
 *     fetchStream("请介绍一下日本文化");
 *   }, []);
 *   
 *   return <div>{isLoading ? '加载中...' : text}</div>;
 * }
 * 
 * // 自定义API端点和参数
 * function CustomEndpointExample() {
 *   const { text } = useStreamFetch("请生成一个故事", {
 *     endpoint: '/api/custom/stream',
 *     extraParams: { 
 *       temperature: '0.7',
 *       format: 'markdown'
 *     }
 *   });
 *   
 *   return <div>{text}</div>;
 * }
 * 
 * // 完全自定义请求URL构建
 * function AdvancedExample() {
 *   const { text } = useStreamFetch("翻译这段文本", {
 *     buildRequestUrl: (prompt, options) => {
 *       const url = new URL('/api/translate/stream', window.location.origin);
 *       url.searchParams.append('text', prompt);
 *       url.searchParams.append('from', 'auto');
 *       url.searchParams.append('to', 'ja');
 *       return url;
 *     },
 *     extractChunk: (data) => {
 *       try {
 *         const parsed = JSON.parse(data);
 *         return parsed.translation || null;
 *       } catch (e) {
 *         return null;
 *       }
 *     }
 *   });
 *   
 *   return <div>{text}</div>;
 * }
 * ```
 */ 