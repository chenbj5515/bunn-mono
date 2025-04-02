import { Hono } from 'hono'
import { getSeriesCover } from './get-series-cover';

const crawlerRouter = new Hono()
    .basePath('/crawler')
    .get("/get-series-cover", getSeriesCover)

// 应用中间件到所有AI路由
export default crawlerRouter 