import { drizzle } from 'drizzle-orm/neon-http';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// 现在环境变量由Turborepo和dotenv-cli自动加载和传递
// 不再需要手动加载.env文件

// 如果环境变量为空，给出明确的错误信息
if (!process.env.DATABASE_URL) {
  throw new Error('环境变量 DATABASE_URL 未定义。请确保在.env文件中设置了此变量。');
}

export const db: NeonHttpDatabase<typeof schema> = drizzle(process.env.DATABASE_URL, { schema });
