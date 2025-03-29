import { Context } from "hono";

export const signOut = async (c: Context) => {
    try {
        // 获取当前请求的cookie
        const cookie = c.req.header('cookie') || '';
        
        // 直接调用better-auth的登出接口
        const response = await fetch(`${process.env.API_BASE_URL}/api/auth/sign-out`, {
            method: 'POST',
            headers: {
                'Cookie': cookie
            }
        });
        
        // 从response中获取Set-Cookie头并传递给客户端
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            c.header('Set-Cookie', setCookie);
        }
        
        return c.json({
            success: true,
            message: '退出成功'
        });
    } catch (error) {
        console.error('登出失败:', error);
        return c.json({
            success: false,
            message: '退出失败'
        }, 500);
    }
}