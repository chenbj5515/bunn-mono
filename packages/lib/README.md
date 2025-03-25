# @bunn/lib

这是一个共享库集合，包含各种可重用的功能模块。

## 包含模块

### Stripe

用于处理 Stripe 支付相关功能的模块。

```typescript
import { stripe } from '@bunn/lib';

// 使用 Stripe 实例
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'usd'
});
```

## 添加新的共享模块

1. 在 `packages/lib` 目录下创建一个新的目录
2. 实现相关功能，并确保导出所需的函数和类
3. 在 `packages/lib/index.ts` 文件中添加导出

## 开发

```bash
# 安装依赖
pnpm install

# 构建库
pnpm build
```

## 使用

在项目的 `package.json` 中添加依赖：

```json
"dependencies": {
  "@bunn/lib": "workspace:*"
}
``` 