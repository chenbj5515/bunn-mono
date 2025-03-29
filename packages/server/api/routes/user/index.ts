import { Hono } from 'hono'
import { session } from './session';
import { signOut } from './sign-out';

const userRouter = new Hono()
  .basePath('/user')
  .get("/session", session)
  .post("/sign-out", signOut)

// 应用中间件到所有AI路由
export default userRouter 