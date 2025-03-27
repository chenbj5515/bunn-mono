import { Hono } from 'hono'
import { authTokenLimitMiddleware } from '@server/middlewares/auth-token-limit';
import { generateText } from './generate-text';
import { generateTextStream } from './generate-text-stream';
import { extractSubtitles } from './extract-subtitles';

const aiRouter = new Hono()
  .basePath('/ai')
  .post("/generate-text", generateText)
  .post("/generate-text-stream", generateTextStream)
  .post("/extract-subtitles", extractSubtitles)

// 应用中间件到所有AI路由
aiRouter.use('/*', authTokenLimitMiddleware);

export default aiRouter 