import { useState, useEffect } from 'react';

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
const INITIAL_CREDITS = 0; // No free credits - must pay $1 for 6 credits

export const useCredits = () => {
    const [credits, setCredits] = useState<number>(INITIAL_CREDITS);
    const [fingerprint, setFingerprint] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        // Check server-side credits first
        const hasServerCredits = await checkCreditsOnServer();
        if (!hasServerCredits) {
            return false;
        }

        // Decrement local credits
        if (credits > 0) {
            const newCredits = credits - 1;
            setCredits(newCredits);
            localStorage.setItem(CREDITS_KEY, newCredits.toString());

            // Notify server
            try {
                await fetch('/api/use-credit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fingerprint }),
                });
            } catch (error) {
                console.error('Failed to update server credits:', error);
            }

            return true;
        }
        return false;
    };

    const hasCredits = (): boolean => {
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
