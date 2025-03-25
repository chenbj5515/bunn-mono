'use server'

import { getSession } from '@server/lib/auth';
import { stripe } from '@lib/stripe'
import { cookies } from 'next/headers'

// Stripe 支持的语言代码类型
type Locale = 'bg' | 'cs' | 'da' | 'de' | 'el' | 'en' | 'es' | 'et' | 'fi' | 'fil' | 'fr' | 'hr' | 'hu' | 'id' | 'it' | 'ja' | 'ko' | 'lt' | 'lv' | 'ms' | 'mt' | 'nb' | 'nl' | 'pl' | 'pt' | 'ro' | 'ru' | 'sk' | 'sl' | 'sv' | 'th' | 'tr' | 'vi' | 'zh';

// 将 Next.js 的语言代码映射到 Stripe 支持的语言代码
function mapLocaleToStripe(locale: string): Locale {
    // 这里可以添加更多的映射关系
    const mapping: Record<string, Locale> = {
        'zh-CN': 'zh',
        'zh-TW': 'zh',
        'zh': 'zh',
        'en': 'en',
        'ja': 'ja'
    };
    return mapping[locale] || 'en';
}

export async function createPortalSession() {
    const session = await getSession();
    const cookieStore = await cookies();
    const nextLocale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    const locale = mapLocaleToStripe(nextLocale);

    if (!session?.user?.email) {
        throw new Error('Not authenticated')
    }

    // 获取用户的 Stripe 客户 ID
    const customer = await stripe.customers.list({
        email: session?.user?.email,
        limit: 1
    })

    if (!customer.data.length) {
        throw new Error('No Stripe customer found')
    }

    // 创建一个新的门户会话
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer.data[0]!.id,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
        locale: locale,
    })

    return portalSession.url
} 