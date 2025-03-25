# @bunn/utils

这个包包含了在Bunn项目中使用的各种实用工具函数。

## 功能

### 文本转语音 (TTS)

提供基于微软认知服务的文本转语音功能。

```typescript
import { speakText, TTSOptions } from '@bunn/utils';

// 使用示例
speakText('你好，世界！', {
  voiceName: 'zh-CN-XiaoxiaoNeural',
  // 可选参数，默认使用环境变量
  // subscriptionKey: 'your-key', 
  // region: 'your-region'
}, () => {
  console.log('语音播放完成');
});
```

## 安装

该包作为工作区包使用，不需要单独安装。在项目的`package.json`中添加：

```json
{
  "dependencies": {
    "@bunn/utils": "workspace:*"
  }
}
```

## 开发

```bash
# 开发模式
pnpm dev

# 构建
pnpm build
``` 