import { useCallback, useEffect, useState } from 'react';

const PAYMENT_STORAGE_KEY = 'abs_payment_id';

type CreditsResponse = {
    hasCredits: boolean;
    remainingCredits: number;
    reason?: string | null;
};

const fetchCredits = async (paymentId: string): Promise<CreditsResponse> => {
    const response = await fetch('/api/check-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
    });

    if (!response.ok) {
        throw new Error('Failed to load credits');
    }

    return response.json();
};

export const useCredits = () => {
    const [credits, setCredits] = useState<number>(0);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const hydratePayment = useCallback(async (pid?: string | null) => {
        const activePaymentId = pid ?? paymentId;

        if (!activePaymentId) {
            setCredits(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await fetchCredits(activePaymentId);
            setCredits(data.hasCredits ? data.remainingCredits : 0);
            setError(null);
        } catch (err) {
            console.error('Failed to load credits:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setCredits(0);
        } finally {
            setLoading(false);
        }
    }, [paymentId]);

    useEffect(() => {
        const storedPaymentId = typeof window !== 'undefined'
            ? localStorage.getItem(PAYMENT_STORAGE_KEY)
            : null;

        if (storedPaymentId) {
            setPaymentId(storedPaymentId);
            hydratePayment(storedPaymentId);
        } else {
            setLoading(false);
        }
    }, [hydratePayment]);

    const registerPayment = useCallback((pid: string) => {
        localStorage.setItem(PAYMENT_STORAGE_KEY, pid);
        setPaymentId(pid);
        hydratePayment(pid);
    }, [hydratePayment]);

    const clearPayment = useCallback(() => {
        localStorage.removeItem(PAYMENT_STORAGE_KEY);
        setPaymentId(null);
        setCredits(0);
    }, []);

    const hasCredits = useCallback(() => credits > 0, [credits]);

    return {
        credits,
        paymentId,
        loading,
        error,
        hasCredits,
        registerPayment,
        refreshCredits: hydratePayment,
        clearPayment,
    };
};
