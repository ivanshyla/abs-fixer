import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import crypto from 'crypto';
import { dynamo, TABLE_NAMES } from '@/lib/aws';
import { ensureServerEnv } from '@/lib/runtime';
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const PRICE_IN_CENTS = 100; // $1.00 per generation
const PAYMENT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const createPaymentToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + PAYMENT_TOKEN_TTL_MS).toISOString();

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
};

export async function POST(req: NextRequest) {
  try {
    ensureServerEnv();
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { userEmail, absType, gender } = await req.json();

    // Create or get user
    let userId: string | null = null;

    if (userEmail) {
      // Check if user exists
      const getUser = await dynamo.send(new GetCommand({
        TableName: TABLE_NAMES.USERS,
        Key: { id: userEmail } // Using email as ID for simplicity in DynamoDB
      }));

      if (getUser.Item) {
        userId = getUser.Item.id;
      } else {
        // Create new user
        userId = userEmail;
        await dynamo.send(new PutCommand({
          TableName: TABLE_NAMES.USERS,
          Item: {
            id: userId,
            email: userEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }));
      }
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PRICE_IN_CENTS,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        user_id: userId || 'anonymous',
        abs_type: absType || 'natural_fit',
        gender: gender || 'unspecified',
      },
    });

    const { rawToken, tokenHash, expiresAt } = createPaymentToken();

    // Persist payment intent metadata
    await dynamo.send(new PutCommand({
      TableName: TABLE_NAMES.PAYMENTS,
      Item: {
        id: paymentIntent.id,
        user_id: userId || 'anonymous',
        user_email: userEmail || null,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_payment_status: paymentIntent.status,
        amount: PRICE_IN_CENTS,
        currency: 'usd',
        credits_total: 6,
        credits_used: 0,
        created_at: new Date().toISOString(),
        payment_access_token_hash: tokenHash,
        payment_access_token_expires_at: expiresAt,
      }
    }));

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentToken: rawToken,
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

