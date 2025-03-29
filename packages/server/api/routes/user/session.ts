import { Context } from "hono";
import { getUserSubscription } from "@server/server-functions/get-subscription";

export const session = async (c: Context) => {
    try {
        // 使用提取的函数获取用户会话和订阅信息
        const userData = await getUserSubscription()

        return c.json({
            success: true,
            data: userData
        })
    } catch (error) {
        console.error('获取session出错:', error)
        // 如果是用户未登录错误，返回401状态码
        if (error instanceof Error && error.message === '用户未登录') {
            return c.json({
                success: false,
                message: '用户未登录'
            }, 401)
        }

        return c.json({
            success: false,
            message: '获取session失败'
        }, 500)
    }
}