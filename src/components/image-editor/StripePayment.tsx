"use client";

import { useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentForm from "./PaymentForm";

interface StripePaymentProps {
  clientSecret: string;
  onSuccess: () => Promise<void> | void;
  onError: (error: string) => void;
  loading: boolean;
}

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#9BA8AB",
    colorBackground: "#11212D",
    colorText: "#CCD0CF",
  },
};

export default function StripePayment({
  clientSecret,
  onSuccess,
  onError,
  loading,
}: StripePaymentProps) {
  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      return null;
    }
    return loadStripe(key);
  }, []);

  if (!stripePromise) {
    return <div className="text-red-500 text-center">Stripe configuration error</div>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance }}
    >
      <PaymentForm onSuccess={onSuccess} onError={onError} loading={loading} />
    </Elements>
  );
}
