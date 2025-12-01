import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface PaymentFormProps {
    onSuccess: (paymentIntentId: string) => Promise<void> | void;
    onError: (error: string) => void;
    loading: boolean;
}

export default function PaymentForm({
    onSuccess,
    onError,
    loading,
}: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        try {
            setProcessing(true);

            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/`,
                },
                redirect: 'if_required',
            });

            if (error) {
                onError(error.message || 'Payment failed');
                setProcessing(false);
                return;
            }

            if (!paymentIntent?.id) {
                onError('Payment confirmation failed. Please try again.');
                setProcessing(false);
                return;
            }

            const confirmResponse = await fetch('/api/payments/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
            });

            if (!confirmResponse.ok) {
                const data = await confirmResponse.json();
                throw new Error(data.error || 'Failed to confirm payment on server');
            }

            await onSuccess(paymentIntent.id);
        } catch (err) {
            console.error('Payment submit error:', err);
            onError(err instanceof Error ? err.message : 'Payment failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Complete Payment</h3>
                <p className="text-gray-600">Secure payment via Stripe - $1.00</p>
            </div>

            <div className="mb-6">
                <PaymentElement />
            </div>

            <button
                type="submit"
                disabled={!stripe || processing || loading}
                className="w-full px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {processing || loading ? 'Processing...' : 'Pay & Generate ($1.00)'}
            </button>
        </form>
    );
}
