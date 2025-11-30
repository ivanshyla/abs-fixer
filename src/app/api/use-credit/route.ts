import { NextRequest, NextResponse } from "next/server";
import { reserveCredit, requirePaymentId } from "@/lib/credits";

type UseCreditRequest = {
    paymentId?: string;
};

export async function POST(req: NextRequest) {
    try {
        const { paymentId }: UseCreditRequest = await req.json();
        const normalizedPaymentId = requirePaymentId(paymentId);

        const result = await reserveCredit(normalizedPaymentId);

        return NextResponse.json({
            success: true,
            remainingCredits: result.remainingCredits,
        });
    } catch (error) {
        console.error("Error using credit:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 400 },
        );
    }
}
