import { Hono } from 'hono'
import { session } from './session';

const userRouter = new Hono()
  .basePath('/user')
  .get("/session", session)

// 应用中间件到所有AI路由
export default userRouter 