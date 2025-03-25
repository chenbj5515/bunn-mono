import { redis } from '@/lib/redis';
import { countTokens as gptCountTokens } from 'gpt-tokenizer';

type ModelType = 'gpt-4o' | 'gpt-3.5-turbo' | 'gpt-4o-1106-preview' | 'gpt-4o-vision-preview' | 'gpt-4o' | string;

interface ModelStats {
  input: number;
  output: number;
  total: number;
}

interface TokenStats {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  models: Record<string, ModelStats>;
}

// 计算token数量
export function countTokens(text: string, model: ModelType = "gpt-4o") {
  try {
    console.log('计算token数量', text, model);
    // 使用gpt-tokenizer库的countTokens方法
    return gptCountTokens(text);
  } catch (error) {
    console.error('计算token出错:', error);
    // 使用简单的估算作为后备方案
    return Math.ceil(text.length / 4);
  }
}

// 生成当前日期的键名前缀
export function getCurrentDayKey(userId: string) {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `token:${userId}:${dateKey}`;
}

// 跟踪token使用 - 直接使用token数量（适用于API返回的确切token数）
export async function trackTokenCount({
  userId,
  inputTokens,
  outputTokens,
  model = 'gpt-4o'
}: {
  userId: string;
  inputTokens: number;
  outputTokens: number;
  model: ModelType;
}) {
  // 生成键名
  const userDayKey = getCurrentDayKey(userId);
  
  // 事务操作
  const pipeline = redis.pipeline();
  
  // 更新总计数
  pipeline.incrby(`${userDayKey}:input`, inputTokens);
  pipeline.incrby(`${userDayKey}:output`, outputTokens);
  
  // 更新特定模型的计数
  pipeline.incrby(`${userDayKey}:${model}:input`, inputTokens);
  pipeline.incrby(`${userDayKey}:${model}:output`, outputTokens);
  
  // 设置过期时间（48小时后自动删除）
  const EXPIRY = 60 * 60 * 48; // 48小时的秒数
  pipeline.expire(`${userDayKey}:input`, EXPIRY);
  pipeline.expire(`${userDayKey}:output`, EXPIRY);
  pipeline.expire(`${userDayKey}:${model}:input`, EXPIRY);
  pipeline.expire(`${userDayKey}:${model}:output`, EXPIRY);
  
  // 执行管道
  await pipeline.exec();
  
  return { inputTokens, outputTokens };
}

// 检查用户是否超过token限制
export async function checkTokenLimit(userId: string, limit: number) {
  if (!limit || limit <= 0) return true; // 如果没有限制，直接返回true
  
  const userDayKey = getCurrentDayKey(userId);
  
  // 获取当前月使用量
  const [inputStr, outputStr] = await Promise.all([
    redis.get<string>(`${userDayKey}:input`),
    redis.get<string>(`${userDayKey}:output`)
  ]);
  
  // 转换为数字并计算总量
  const inputTokens = parseInt(inputStr || '0');
  const outputTokens = parseInt(outputStr || '0');
  const totalTokens = inputTokens + outputTokens;

  console.log('检查token限制', totalTokens, limit);
  
  // 返回是否低于限制
  return totalTokens < limit;
}

// 从数据库获取用户的月度token限额
export async function getUserTokenLimit(userId: string) {
  // 从Redis中获取限额
  // const limit = await redis.get<string>(`limit:${userId}:monthly`);
  
  // if (limit) {
  //   return parseInt(limit);
  // }
  
  // 如果Redis中没有，可以从数据库获取，这里返回默认值
  // 实际实现中，您可能需要从用户订阅表中获取
  return 50000; // 默认限制，可以根据实际情况调整
}

// 获取用户的token使用统计
export async function getUserTokenStats(userId: string): Promise<TokenStats> {
  const userDayKey = getCurrentDayKey(userId);
  
  // 获取所有相关的键
  const keys = await redis.keys(`${userDayKey}*`);
  
  if (keys.length === 0) {
    return { 
      totalTokens: 0,
      inputTokens: 0, 
      outputTokens: 0, 
      models: {} 
    };
  }
  
  // 获取所有键的值
  const values = await Promise.all(keys.map(key => redis.get<string>(key)));
  
  // 解析结果
  const stats: TokenStats = {
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    models: {}
  };
  
  keys.forEach((key, index) => {
    const value = parseInt(values[index] || '0');
    const parts = key.split(':');
    
    // 处理总计数
    if (parts.length === 4) { // token:userId:period:type
      if (parts[3] === 'input') {
        stats.inputTokens = value;
        stats.totalTokens += value;
      } else if (parts[3] === 'output') {
        stats.outputTokens = value;
        stats.totalTokens += value;
      }
    } 
    // 处理模型特定计数
    else if (parts.length === 5) { // token:userId:period:model:type
      const model = parts[3];
      const type = parts[4];
      
      if (!stats.models[model]) {
        stats.models[model] = { input: 0, output: 0, total: 0 };
      }
      
      if (type === 'input') {
        stats.models[model].input = value;
        stats.models[model].total += value;
      } else if (type === 'output') {
        stats.models[model].output = value;
        stats.models[model].total += value;
      }
    }
  });
  
  return stats;
}

// 设置用户的月度token限额
export async function setUserTokenLimit(userId: string, limit: number) {
  await redis.set(`limit:${userId}:monthly`, limit.toString());
  return true;
} 