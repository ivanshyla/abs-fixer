import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const PRICE_IN_CENTS = 500; // $5.00 per generation

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });

    const { userEmail, absType, gender } = await req.json();

    // Create or get user
    let userId: string | null = null;
    
    if (userEmail) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, stripe_customer_id')
        .eq('email', userEmail)
        .single();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({ email: userEmail })
          .select()
          .single();

        if (error) throw error;
        userId = newUser.id;
      }
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PRICE_IN_CENTS,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: userId || 'anonymous',
        abs_type: absType || 'natural_fit',
        gender: gender || 'unspecified',
      },
    });

    // Save payment record to database
    if (userId) {
      await supabase.from('payments').insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_payment_status: paymentIntent.status,
        amount: PRICE_IN_CENTS,
        currency: 'usd',
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: unknown) {
    console.error('Payment intent creation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

