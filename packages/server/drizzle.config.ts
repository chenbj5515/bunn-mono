import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { resolve } from 'path';

// 从项目根目录加载.env文件
config({ path: resolve(__dirname, '../../.env') });

// 检查环境变量是否存在
if (!process.env.DATABASE_URL) {
    throw new Error('环境变量 DATABASE_URL 未定义。请确保在.env文件中设置了此变量。');
}

export default defineConfig({
    out: './drizzle',
    schema: './db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
