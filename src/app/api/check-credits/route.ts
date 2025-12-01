import { NextRequest, NextResponse } from "next/server";
import { fetchPayment, ensurePaymentHasCredits } from "@/lib/credits";

type CheckCreditsRequest = {
    paymentId?: string;
};

export async function POST(req: NextRequest) {
    try {
        const { paymentId }: CheckCreditsRequest = await req.json();

        if (!paymentId) {
            return NextResponse.json({
                hasCredits: false,
                remainingCredits: 0,
                reason: "missing_payment",
            });
        }

        const payment = await fetchPayment(paymentId);
        const evaluation = ensurePaymentHasCredits(payment);

        return NextResponse.json({
            hasCredits: evaluation.ok,
            remainingCredits: evaluation.remainingCredits,
            reason: evaluation.reason,
        });
    } catch (error) {
        console.error("Error checking credits:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
