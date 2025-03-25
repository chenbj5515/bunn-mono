# 认证系统（Auth）运作说明

## 概述

本项目使用 `better-auth` 作为认证系统的核心库，提供完整的用户认证和会话管理功能。认证系统的初始化和配置主要在 `packages/server/lib/auth.ts` 文件中实现。

## 初始化过程

认证系统的初始化在 `packages/server/lib/auth.ts` 文件中通过 `betterAuth` 函数完成。该函数接受一个配置对象，定义了认证系统的各种行为和选项。

```typescript
export const auth = betterAuth({
    // 配置选项...
});
```

## 主要配置选项

### 数据库适配器

系统使用 Drizzle ORM 作为数据库适配器，连接到应用程序的数据库：

```typescript
database: drizzleAdapter(db, {
    provider: "pg", // 或 "mysql", "sqlite"
    schema: schema,
}),
```

### 认证方式

支持多种认证方式：

1. **电子邮件和密码**：
   ```typescript
   emailAndPassword: {
       enabled: true,
   },
   ```

2. **社交媒体登录**：
   ```typescript
   socialProviders: {
       github: {
           clientId: process.env.GITHUB_CLIENT_ID || '',
           clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
       },
       google: {
           clientId: process.env.GOOGLE_CLIENT_ID || '',
           clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
       },
   },
   ```

### JWT 配置

JSON Web Token 配置，用于会话管理：

```typescript
jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
},
```

### Cookie 配置

会话 Cookie 的配置参数：

```typescript
cookie: {
    name: 'session',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
},
```

### 页面配置

自定义认证相关页面的路径：

```typescript
pages: {
    signIn: '/login',
    error: '/auth/error',
},
```

### 跨域支持

支持特定来源的跨域请求：

```typescript
cors: {
    origin: ['chrome-extension://lmepenbgdgfihjehjnanphnfhobclghl'],
    credentials: true,
},
trustedOrigins: ['chrome-extension://lmepenbgdgfihjehjnanphnfhobclghl'],
```

## API 功能

`auth.ts` 文件还导出了几个辅助函数，简化了认证操作：

1. **获取会话**：
   ```typescript
   export async function getSession() {
       return await auth.api.getSession({
           headers: await headers()
       })
   }
   ```

2. **登录**：
   ```typescript
   export async function signIn(provider: string) {
       return { url: `/api/auth/better-auth/signin/${provider}` };
   }
   ```

3. **登出**：
   ```typescript
   export async function signOut() {
       return { redirect: '/api/auth/better-auth/signout' };
   }
   ```

## Next.js 集成

系统支持与 Next.js 的集成，导出了必要的处理函数：

```typescript
export { toNextJsHandler } from "better-auth/next-js";
```

## 环境变量要求

正确配置以下环境变量对认证系统的运行至关重要：

- `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`：GitHub OAuth 应用凭证
- `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`：Google OAuth 应用凭证
- `JWT_SECRET`：用于签名 JWT 的密钥
- `NODE_ENV`：确定是否使用安全 Cookie（生产环境）
