// import { handleError } from './error'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import usersRoute from './routes/user/index'
import aiRoute from './routes/ai'
import crawlerRoute from './routes/crawler'
const app = new Hono().basePath('/api')

// 添加CORS中间件，允许localhost:3000跨域访问
app.use('/*', cors({
  origin: 'chrome-extension://apljdgcegjfmknaekcmmknknikafjenj',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// app.onError(handleError)

// 定义API路由
const routes = app
  .route('/', aiRoute)  // 这里已经包含了ai路由，它内部已经设置了basePath('/ai')
  .route('/', usersRoute)
  .route('/', crawlerRoute)

export default app

export type AppType = typeof routes
