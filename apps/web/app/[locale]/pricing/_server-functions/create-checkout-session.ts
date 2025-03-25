'use server'

import { cookies } from 'next/headers'
import { stripe } from '@lib/stripe'
import { getSession } from '@server/lib/auth'


export async function createCheckoutSession() {
    const data = await getSession()
    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'

    if (!data?.session?.userId) {
        return { url: `/${locale}/login?redirect=/pricing` }
        // throw new Error('User must be logged in')
    }

    const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        client_reference_id: data.session.userId,
        line_items: [
            {
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            },
        ],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-result?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    })

    return { url: checkoutSession.url }
} 