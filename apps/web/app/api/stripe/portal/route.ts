import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserSubscription } from '@server/server-functions/get-subscription';

// 创建 Stripe 客户端实例
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
});

// 语言映射函数
function mapLocaleToStripe(locale: string): 'en' | 'zh' | 'ja' {
    const localeMap: { [key: string]: 'en' | 'zh' | 'ja' } = {
        'en': 'en',
        'zh': 'zh',
        'ja': 'ja',
        // 可以根据需要添加更多语言映射
    };
    return localeMap[locale] || 'en';
}

export async function POST(req: NextRequest) {
    try {
        // 从会话中获取用户信息
        const { session } = await getUserSubscription();
        
        if (!session?.user?.email) {
            return NextResponse.json({ 
                success: false, 
                error: '未授权' 
            }, { status: 401 });
        }
        
        const user = session.user;
        
        // 获取区域设置信息
        const { locale = 'zh' } = await req.json();

        // 获取用户的 Stripe 客户 ID
        const customer = await stripeClient.customers.list({
            email: user.email,
            limit: 1
        });

        if (!customer.data.length) {
            return NextResponse.json({ 
                success: false, 
                error: '未找到 Stripe 客户' 
            }, { status: 404 });
        }

        const customerId = customer.data[0]?.id;
        
        if (!customerId) {
            return NextResponse.json({ 
                success: false, 
                error: '无效的 Stripe 客户 ID' 
            }, { status: 404 });
        }

        // 创建一个新的门户会话
        const portalSession = await stripeClient.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
            locale: mapLocaleToStripe(locale),
        });

        return NextResponse.json({
            success: true,
            url: portalSession.url
        });
    } catch (error: any) {
        console.error('创建门户会话失败:', error);
        return NextResponse.json({
            success: false,
            error: error?.message || '创建门户会话失败'
        }, { status: 500 });
    }
} 