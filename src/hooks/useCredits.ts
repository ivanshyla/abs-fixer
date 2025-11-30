import { useState, useEffect } from 'react';
import { DEFAULT_FREE_CREDITS, DEMO_MODE, SERVER_CREDITS_ENABLED } from '@/lib/envFlags';

// Generate browser fingerprint
const generateFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('fingerprint', 2, 2);
    }

    const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvasData: canvas.toDataURL(),
    };

    // Simple hash function
    const str = JSON.stringify(fingerprint);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
};

const CREDITS_KEY = 'abs_credits_v2';
const FINGERPRINT_KEY = 'abs_fingerprint';
const INITIAL_CREDITS = DEFAULT_FREE_CREDITS;
const DEMO_CREDITS = Number.POSITIVE_INFINITY;

export const useCredits = () => {
    const [credits, setCredits] = useState<number>(DEMO_MODE ? DEMO_CREDITS : INITIAL_CREDITS);
    const [fingerprint, setFingerprint] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (DEMO_MODE) {
            setCredits(DEMO_CREDITS);
            setFingerprint('demo');
            setLoading(false);
            return;
        }

        // Get or create fingerprint
        let fp = localStorage.getItem(FINGERPRINT_KEY);
        if (!fp) {
            fp = generateFingerprint();
            localStorage.setItem(FINGERPRINT_KEY, fp);
        }
        setFingerprint(fp);

        // Get credits from localStorage
        const storedCredits = localStorage.getItem(CREDITS_KEY);
        if (storedCredits) {
            setCredits(parseInt(storedCredits, 10));
        } else {
            localStorage.setItem(CREDITS_KEY, INITIAL_CREDITS.toString());
        }

        setLoading(false);
    }, []);

    const checkCreditsOnServer = async (): Promise<boolean> => {
        if (DEMO_MODE || !SERVER_CREDITS_ENABLED) {
            return true;
        }

        try {
            const response = await fetch('/api/check-credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fingerprint }),
            });
            const data = await response.json();
            return data.hasCredits;
        } catch (error) {
            console.error('Failed to check credits on server:', error);
            // Fallback to localStorage if server check fails
            return credits > 0;
        }
    };

    const consumeCredit = async (): Promise<boolean> => {
        if (DEMO_MODE) {
            return true;
        }

        // Check server-side credits first (if enabled)
        if (SERVER_CREDITS_ENABLED) {
            const hasServerCredits = await checkCreditsOnServer();
            if (!hasServerCredits) {
                return false;
            }
        }

        if (credits > 0) {
            const newCredits = credits - 1;
            setCredits(newCredits);
            localStorage.setItem(CREDITS_KEY, newCredits.toString());

            if (SERVER_CREDITS_ENABLED) {
                try {
                    await fetch('/api/use-credit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fingerprint }),
                    });
                } catch (error) {
                    console.error('Failed to update server credits:', error);
                }
            }

            return true;
        }
        return false;
    };

    const hasCredits = (): boolean => {
        if (DEMO_MODE) {
            return true;
        }
        return credits > 0;
    };

    return {
        credits,
        fingerprint,
        loading,
        consumeCredit,
        hasCredits,
    };
};
