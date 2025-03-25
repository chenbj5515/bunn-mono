# Drizzle 使用文档

## 文件结构

项目中的Drizzle相关文件主要位于以下目录：

- **主要文件目录**: `packages/server/db/`
  - `schema.ts`: 定义数据库表结构和关系
  - `relations.ts`: 定义表之间的关系
  - `index.ts`: 配置数据库连接和导出db实例

- **配置文件**: `packages/server/drizzle.config.ts`

## Schema定义

数据库模式定义在 `packages/server/db/schema.ts` 文件中，包含以下主要表：

- `user`: 用户信息表
- `account`: 账户表
- `session`: 会话表
- `verification`: 验证表
- `memoCard`: 记忆卡表
- `wordCard`: 单词卡表
- `exams`: 考试表
- `examResults`: 考试结果表
- `userSubscription`: 用户订阅表
- `userActionLogs`: 用户行为日志表
- `articles`: 文章表

## 关系定义

表之间的关系定义在 `packages/server/db/relations.ts` 文件中，使用Drizzle的relations API实现一对多、多对一等关系。

主要关系包括：
- wordCard与memoCard的关系
- user与account、session、userSubscription的关系

## 数据库连接

在 `packages/server/db/index.ts` 中配置数据库连接：

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const db: NeonHttpDatabase<typeof schema> = drizzle(process.env.DATABASE_URL, { schema });
```

## 迁移配置

Drizzle迁移配置文件位于 `packages/server/drizzle.config.ts`：

```typescript
export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
```

## 使用方法

### 查询数据
```typescript
import { db } from 'path/to/db';
import { user } from 'path/to/db/schema';
import { eq } from 'drizzle-orm';

// 查询单个用户
const singleUser = await db.query.user.findFirst({
  where: eq(user.id, userId)
});

// 查询所有用户
const allUsers = await db.query.user.findMany();
```

### 插入数据
```typescript
import { db } from 'path/to/db';
import { user } from 'path/to/db/schema';

const newUser = await db.insert(user).values({
  id: 'user-id',
  name: '用户名',
  email: 'user@example.com',
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date()
}).returning();
```

### 更新数据
```typescript
import { db } from 'path/to/db';
import { user } from 'path/to/db/schema';
import { eq } from 'drizzle-orm';

await db.update(user)
  .set({ name: '新用户名' })
  .where(eq(user.id, userId));
```

### 删除数据
```typescript
import { db } from 'path/to/db';
import { user } from 'path/to/db/schema';
import { eq } from 'drizzle-orm';

await db.delete(user).where(eq(user.id, userId));
```

## 注意事项

1. 环境变量 `DATABASE_URL` 必须正确设置，否则会抛出错误。
2. 使用表关系查询时，确保已经导入了对应的关系定义。
3. 修改schema后，需要运行迁移命令更新数据库结构。
