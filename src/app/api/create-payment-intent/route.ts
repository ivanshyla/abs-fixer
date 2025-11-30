import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { dynamo, TABLE_NAMES } from '@/lib/aws';
import { ensureServerEnv } from '@/lib/runtime';
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const PRICE_IN_CENTS = 100; // $1.00 per generation

export async function POST(req: NextRequest) {
  try {
    ensureServerEnv();
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

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
      await dynamo.send(new PutCommand({
        TableName: TABLE_NAMES.PAYMENTS,
        Item: {
          id: paymentIntent.id,
          user_id: userId,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_payment_status: paymentIntent.status,
          amount: PRICE_IN_CENTS,
          currency: 'usd',
          credits_total: 6,
          credits_used: 0,
          created_at: new Date().toISOString(),
        }
      }));
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

