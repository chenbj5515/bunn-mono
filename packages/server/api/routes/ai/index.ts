import { Hono } from 'hono'
import { authTokenLimitMiddleware } from '@server/middlewares/auth-token-limit';
import { generateText } from './generate-text';
import { generateTextStream } from './generate-text-stream';
import { extractSubtitles } from './extract-subtitles';

const aiRouter = new Hono()
  .basePath('/ai')
  .post("/generate-text", authTokenLimitMiddleware, generateText)
  .post("/generate-text-stream", authTokenLimitMiddleware, generateTextStream)
  .post("/extract-subtitles", authTokenLimitMiddleware,extractSubtitles)

// 应用中间件到所有AI路由
// aiRouter

export default aiRouter 