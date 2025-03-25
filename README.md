# Bunn Monorepo

基于Turborepo构建的现代化Web应用和浏览器插件。

## 项目结构

```
bunn-mono/
├── apps/
│   ├── web/            # Next.js Web应用
│   └── extension/      # 浏览器插件
├── packages/
│   └── ui/             # 共享UI组件库
└── package.json
```

## 特性

- **Web应用**：基于Next.js 15构建，使用Hono处理API路由
- **浏览器插件**：使用React和Rollup构建
- **UI组件库**：基于Radix UI和Tailwind CSS构建的共享组件
- **统一工作流**：使用Turborepo管理构建流程和依赖

## 技术栈

- **前端**：React 19, Next.js 15, Tailwind CSS
- **API**：Hono (类型安全的API路由)
- **构建工具**：Turborepo, Rollup
- **包管理**：pnpm
- **类型检查**：TypeScript

## 开始使用

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
# 启动所有应用
pnpm dev

# 只启动Web应用
pnpm dev --filter web

# 只启动插件开发
pnpm dev --filter @bunn/extension
```

### 构建

```bash
# 构建所有应用
pnpm build

# 只构建Web应用
pnpm build --filter web

# 只构建插件
pnpm build --filter @bunn/extension
```

## 许可证

MIT 