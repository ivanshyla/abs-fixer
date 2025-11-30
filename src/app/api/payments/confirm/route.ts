import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { dynamo, TABLE_NAMES } from "@/lib/aws";
import { ensureServerEnv } from "@/lib/runtime";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

type ConfirmPaymentRequest = {
    paymentIntentId?: string;
};

const DEFAULT_CREDIT_TOTAL = 6;

export async function POST(req: NextRequest) {
    try {
        ensureServerEnv();
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is not configured");
        }

        const { paymentIntentId }: ConfirmPaymentRequest = await req.json();
        if (!paymentIntentId) {
            return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (!paymentIntent) {
            return NextResponse.json({ error: "Payment intent not found" }, { status: 404 });
        }

        await dynamo.send(
            new UpdateCommand({
                TableName: TABLE_NAMES.PAYMENTS,
                Key: { id: paymentIntentId },
                UpdateExpression:
                    "SET stripe_payment_status = :status, credits_total = if_not_exists(credits_total, :defaultCredits)",
                ExpressionAttributeValues: {
                    ":status": paymentIntent.status,
                    ":defaultCredits": DEFAULT_CREDIT_TOTAL,
                },
            }),
        );

        return NextResponse.json({
            paymentIntentId,
            status: paymentIntent.status,
        });
    } catch (error) {
        console.error("Payment confirmation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 },
        );
    }
}
