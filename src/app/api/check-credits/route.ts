import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "abs-fixer-credits";
const MAX_CREDITS = 6;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
    try {
        const { fingerprint } = await req.json();
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

        if (!fingerprint) {
            return NextResponse.json({ error: "Missing fingerprint" }, { status: 400 });
        }

        // Check fingerprint-based credits
        const fingerprintKey = `fp_${fingerprint}`;
        const fingerprintRecord = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { id: fingerprintKey },
            })
        );

        // Check IP-based rate limit
        const ipKey = `ip_${ip}`;
        const ipRecord = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { id: ipKey },
            })
        );

        const now = Date.now();

        // Check fingerprint credits
        if (fingerprintRecord.Item) {
            const creditsUsed = fingerprintRecord.Item.creditsUsed || 0;
            if (creditsUsed >= MAX_CREDITS) {
                return NextResponse.json({ hasCredits: false, reason: "fingerprint_limit" });
            }
        }

        // Check IP rate limit
        if (ipRecord.Item) {
            const lastReset = ipRecord.Item.lastReset || 0;
            const creditsUsed = ipRecord.Item.creditsUsed || 0;

            // Reset if 24 hours passed
            if (now - lastReset > RATE_LIMIT_WINDOW) {
                // Will be reset on next use-credit call
            } else if (creditsUsed >= MAX_CREDITS) {
                return NextResponse.json({ hasCredits: false, reason: "ip_limit" });
            }
        }

        return NextResponse.json({ hasCredits: true });
    } catch (error) {
        console.error("Error checking credits:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
