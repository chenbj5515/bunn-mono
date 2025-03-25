import { useState, useEffect } from 'react';
import { checkSubscription, SubscriptionStatus } from '@/server-functions/check-subscription';

/**
 * 自定义Hook，用于获取用户订阅状态
 * @returns 包含isSubscribed和expiryTime的订阅状态对象
 */
export function useSubscription() {
    const [subscriptionStatus, setSubscriptionStatus] = useState<{
        active: boolean | null;
        expiryTime: Date | null;
    }>({
        active: null,
        expiryTime: null
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchSubscriptionStatus = async () => {
            try {
                setLoading(true);
                const status = await checkSubscription();
                setSubscriptionStatus(status);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('获取订阅状态失败'));
                console.error('获取订阅状态失败:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptionStatus();
    }, []);

    return {
        ...subscriptionStatus,
        loading,
        error
    };
}
