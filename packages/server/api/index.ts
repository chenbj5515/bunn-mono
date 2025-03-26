// import { handleError } from './error'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import usersRoute from './routes/user'
import aiRoute from './routes/ai'
// import todoRoute from './routes/todo'
// import helloRoute from './routes/hello'
const app = new Hono().basePath('/api')

// 添加CORS中间件，允许localhost:3000跨域访问
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// app.onError(handleError)

// 定义API路由
const routes = app
  .route('/', aiRoute)  // 这里已经包含了ai路由，它内部已经设置了basePath('/ai')
  .route('/', usersRoute)

export default app

export type AppType = typeof routes

// 为客户端提供更明确的类型定义
// export interface ApiClientType {
//   api: {
//     ai: {
//       'extract-subtitles': {
//         $post: (options: { form: FormData }) => Promise<Response>
//       }
//     },
//     user: {
//       session: {
//         $get: () => Promise<Response>
//       }
//     }
//   }
// }
