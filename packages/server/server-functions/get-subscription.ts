import { getSession } from '@server/lib/auth'
import { db } from '@db/index'
import { userSubscription } from '@db/schema'
import { eq, desc } from 'drizzle-orm'

// 定义订阅状态接口
export interface SubscriptionStatus {
  active: boolean;
  expireAt: string | null;
}

// 定义返回数据接口
export interface UserSessionData {
  session: any;
  subscription: SubscriptionStatus;
}

/**
 * 获取用户会话和订阅信息
 * @returns 包含用户会话和订阅状态的对象
 */
export async function getUserSubscription(): Promise<UserSessionData> {
  // 获取用户session
  const session = await getSession()

  if (!session?.user?.id) {
    throw new Error('用户未登录')
  }

  // 获取用户订阅信息，查找endTime最大的记录
  const subscriptions = await db
    .select()
    .from(userSubscription)
    .where(eq(userSubscription.userId, session.user.id))
    .orderBy(desc(userSubscription.endTime))
    .limit(1)

  // 准备返回数据
  let subscriptionStatus: SubscriptionStatus = {
    active: false,
    expireAt: null
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

  // 返回会话和订阅状态
  return {
    session,
    subscription: subscriptionStatus
  }
}
