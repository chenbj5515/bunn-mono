import { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { getUserSubscription } from '@server/server-functions/get-subscription';
import { checkTokenLimit, getUserTokenLimit } from '@server/redis/token-tracker';

// OpenAI 接口认证中间件
export async function openaiAuthMiddleware(c: Context, next: () => Promise<void>) {
    // 如果请求体是流,先读取formData
    const contentType = c.req.header('Content-Type') || '';
    if (contentType.includes('multipart/form-data')) {
        await c.req.formData();
    }
   
    // 获取用户订阅信息
    try {
        const { subscription, session } = await getUserSubscription();
        
        // 无论是否有订阅，都检查使用限制
        // 获取用户的每日token限额
        const userId = session?.user?.id;
        
        if (!userId) {
            return c.json({ 
                success: false, 
                message: '未授权访问' 
            }, 401);
        }
        
        // 获取用户的token限额
        const tokenLimit = await getUserTokenLimit(userId);
        
        // 根据订阅状态可能应用不同的限额
        const effectiveLimit = subscription.active 
            ? tokenLimit * 5 // 订阅用户获得5倍限额
            : tokenLimit;    // 非订阅用户使用基础限额
            
        // 检查是否超过限额
        const hasReachedLimit = !(await checkTokenLimit(userId, effectiveLimit));
        
        if (hasReachedLimit) {
            return c.json({ 
                success: false, 
                message: subscription.active 
                    ? '您已达到当日使用限制，请明天再试' 
                    : '您已达到使用限制，请升级订阅获得更多次数' 
            }, 403);
        }
        
    } catch (error) {
        // 处理错误情况，例如用户未登录
        console.error('检查订阅状态时出错:', error);
        return c.json({ 
            success: false, 
            message: '无法验证您的访问权限' 
        }, 401);
    }
    
    await next();
} 