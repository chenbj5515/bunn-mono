import { Context, Next } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { getUserSubscription } from "@server/server-functions/get-subscription";
import { getUserTokenLimit, checkTokenLimit } from "@server/redis/token-tracker";

// 错误码定义
export const ERROR_CODES = {
    // 认证相关错误 (1000-1999)
    UNAUTHORIZED: 1001,

    // 输入相关错误 (2000-2999)
    INVALID_REQUEST_BODY: 2001,
    MISSING_PARAMETERS: 2002,
    MISSING_IMAGE: 2003,

    // 限制相关错误 (3000-3999)
    TOKEN_LIMIT_EXCEEDED: 3001,

    // API相关错误 (4000-4999)
    API_KEY_MISSING: 4001,
    API_ERROR: 4002,
    MODEL_NOT_SUPPORTED: 4003,

    // 服务器错误 (5000-5999)
    INTERNAL_SERVER_ERROR: 5001
};

// 验证用户并检查token限制的中间件
export const authTokenLimitMiddleware = async (c: Context, next: Next) => {
    try {
        // 获取用户会话
        const { session, subscription: { active, expireAt } } = await getUserSubscription();
        if (!session?.user) {
            return c.json({
                success: false,
                error: '未授权',
                errorCode: ERROR_CODES.UNAUTHORIZED
            }, 401 as ContentfulStatusCode);
        }

        const user = session.user;

        // 获取用户token限额
        const limit = await getUserTokenLimit(user.id);

        // 检查是否超过限额
        const isWithinLimit = await checkTokenLimit(user.id, limit);
        if (!isWithinLimit) {
            return c.json({
                success: false,
                error: '您已达到本月token使用限制，请联系管理员或等待下月重置',
                errorCode: ERROR_CODES.TOKEN_LIMIT_EXCEEDED
            }, 403 as ContentfulStatusCode);
        }

        // 将用户信息存入上下文
        c.set('user', user);
        c.set('subscription', { active, expireAt });
        
        // 继续处理请求
        await next();
    } catch (err: unknown) {
        console.error('认证或限额检查错误:', err instanceof Error ? err.message : '未知错误');
        
        let statusCode = 500;
        let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
        let errorMessage = '服务器内部错误';

        if (err instanceof Error) {
            errorMessage = err.message;

            if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
                errorCode = ERROR_CODES.UNAUTHORIZED;
                statusCode = 401;
            }
        }

        return c.json({
            success: false,
            error: errorMessage,
            errorCode: errorCode,
            stack: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.stack : undefined) : undefined
        }, statusCode as ContentfulStatusCode);
    }
};

// 用于处理API错误的工具函数
export const handleApiError = (err: unknown) => {
    console.error('API错误:', err instanceof Error ? err.message : '未知错误');

    let statusCode = 500;
    let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
    let errorMessage = '服务器内部错误';

    if (err instanceof Error) {
        errorMessage = err.message;

        // 识别特定类型的错误
        if (errorMessage.includes('API key')) {
            errorCode = ERROR_CODES.API_ERROR;
            errorMessage = 'API密钥错误';
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
            errorCode = ERROR_CODES.API_ERROR;
            statusCode = 429;
            errorMessage = 'API请求超过速率限制';
        } else if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
            errorCode = ERROR_CODES.UNAUTHORIZED;
            statusCode = 401;
        }
    }

    return {
        statusCode, 
        errorCode, 
        errorMessage,
        stack: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.stack : undefined) : undefined
    };
}; 