"use client";

import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentForm from "./PaymentForm";

interface StripePaymentProps {
  clientSecret: string;
  loading: boolean;
  onSuccess: () => Promise<void> | void;
  onError: (error: string) => void;
  onBack: () => void;
}

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function StripePayment({
  clientSecret,
  loading,
  onSuccess,
  onError,
  onBack,
}: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <div className="text-center text-red-500">
        Stripe configuration error
        <button
          onClick={onBack}
          className="mt-4 text-brand-light hover:text-brand-lighter underline w-full text-center block"
        >
          Back to Editor
        </button>
      </div>
    );
  }

  return (
    <div>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "#9BA8AB",
              colorBackground: "#11212D",
              colorText: "#CCD0CF",
            },
          },
        }}
      >
        <PaymentForm
          onSuccess={onSuccess}
          onError={onError}
          loading={loading}
        />
      </Elements>
      <button
        onClick={onBack}
        className="mt-4 text-brand-light hover:text-brand-lighter underline w-full text-center"
      >
        Back to Editor
      </button>
    </div>
  );
}
