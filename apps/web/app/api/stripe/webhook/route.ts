import { NextRequest, NextResponse } from 'next/server';
import { db } from '@server/db';
import { userSubscription } from '@server/db/schema';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';

// 创建 Stripe 客户端实例
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ success: false, error: '缺少 Stripe 签名' }, { status: 400 });
    }

    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    if (!STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ success: false, error: '未配置 Stripe Webhook Secret' }, { status: 500 });
    }

    try {
        const rawBody = await req.text();
        const event = stripeClient.webhooks.constructEvent(
            rawBody,
            signature,
            STRIPE_WEBHOOK_SECRET
        );

        console.log('event=============', event.type);

        // 处理发票支付成功事件
        if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object as Stripe.Invoice;

            console.log('invoice=============', invoice);
            // 获取关联的 checkout session
            const session = await stripeClient.checkout.sessions.list({
                payment_intent: invoice.payment_intent as string,
                limit: 1,
            });

            if (!session.data.length) {
                throw new Error('未找到关联的 Checkout Session');
            }

            console.log('session data=============', session.data[0]);
            const userId = session.data[0]?.client_reference_id;

            if (!userId) {
                throw new Error('未找到用户ID');
            }

            // 计算订阅时间
            const startTime = new Date().toISOString();
            const endTime = new Date();
            endTime.setMonth(endTime.getMonth() + 1);
            const endTimeIso = endTime.toISOString();

            // 查找现有订阅
            const existingSubscriptions = await db.select().from(userSubscription).where(eq(userSubscription.userId, userId));
            const existingSubscription = existingSubscriptions[0];

            if (existingSubscription) {
                // 更新现有订阅
                await db.update(userSubscription)
                    .set({
                        startTime,
                        endTime: endTimeIso,
                        active: true
                    })
                    .where(eq(userSubscription.id, existingSubscription.id));
            } else {
                // 创建新订阅
                await db.insert(userSubscription).values({
                    userId,
                    startTime,
                    endTime: endTimeIso,
                    active: true
                });
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Stripe webhook 处理错误:', err);
        return NextResponse.json({
            success: false,
            error: err?.message || 'Stripe webhook 处理失败'
        }, { status: 400 });
    }
} 