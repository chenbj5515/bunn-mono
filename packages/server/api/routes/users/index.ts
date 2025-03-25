import { Hono } from 'hono'
import { getSession } from '../../../lib/auth'
import { db } from '../../../db'
import { userSubscription } from '../../../db/schema'
import { eq, desc } from 'drizzle-orm'

const app = new Hono()
  .basePath('/users')
  .get('/session', async (c) => {
    try {
      // 获取用户session
      const session = await getSession()

      if (!session?.user?.id) {
        return c.json({
          success: false,
          message: '用户未登录'
        }, 401)
      }

      // 获取用户订阅信息，查找endTime最大的记录
      const subscriptions = await db
        .select()
        .from(userSubscription)
        .where(eq(userSubscription.userId, session.user.id))
        .orderBy(desc(userSubscription.endTime))
        .limit(1)

      // 准备返回数据
      let subscriptionStatus = {
        active: false,
        expireAt: null as string | null
      }

      // 检查是否有订阅记录
      if (subscriptions.length > 0) {
        const latestSubscription = subscriptions[0]
        if (latestSubscription) { // 确保latestSubscription存在
          const now = new Date()
          const endTime = new Date(latestSubscription.endTime)

          // 检查订阅是否有效（结束时间大于当前时间）
          subscriptionStatus = {
            active: endTime > now && latestSubscription.active,
            expireAt: latestSubscription.endTime
          }
        }
      }

      // 合并session和订阅状态
      return c.json({
        success: true,
        data: {
          session,
          subscription: subscriptionStatus
        }
      })
    } catch (error) {
      console.error('获取session出错:', error)
      return c.json({
        success: false,
        message: '获取session失败'
      }, 500)
    }
  })

export default app
