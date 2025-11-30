import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { dynamo, TABLE_NAMES } from '@/lib/aws';
import { ensureServerEnv } from '@/lib/runtime';
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(req: NextRequest) {
  try {
    ensureServerEnv();
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe keys not configured');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const status = event.type === 'payment_intent.succeeded' ? 'succeeded' : 'failed';

      // Find payment by stripe_payment_intent_id
      // Note: In production, add a GSI on stripe_payment_intent_id for efficiency
      const scanResult = await dynamo.send(new ScanCommand({
        TableName: TABLE_NAMES.PAYMENTS,
        FilterExpression: "stripe_payment_intent_id = :id",
        ExpressionAttributeValues: {
          ":id": paymentIntent.id
        }
      }));

      if (scanResult.Items && scanResult.Items.length > 0) {
        const paymentId = scanResult.Items[0].id;

        await dynamo.send(new UpdateCommand({
          TableName: TABLE_NAMES.PAYMENTS,
          Key: { id: paymentId },
          UpdateExpression: "set stripe_payment_status = :s",
          ExpressionAttributeValues: {
            ":s": status
          }
        }));
        console.log(`Payment ${status}:`, paymentIntent.id);
      } else {
        console.log('Payment record not found for intent:', paymentIntent.id);
      }
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

