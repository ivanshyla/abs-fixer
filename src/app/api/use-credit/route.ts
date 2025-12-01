import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "abs-fixer-credits";
const MAX_CREDITS = 6;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

const readUsageRecord = async (key: string, now: number) => {
    const record = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { id: key },
        })
    );

    const item = record.Item;
    const lastReset = item?.lastReset ?? now;
    const shouldReset = now - lastReset > RATE_LIMIT_WINDOW;
    const creditsUsed = shouldReset ? 0 : item?.creditsUsed ?? 0;

    return {
        creditsUsed,
        lastReset: shouldReset ? now : lastReset,
        shouldReset,
    };
};

export async function POST(req: NextRequest) {
    try {
        const { fingerprint } = await req.json();
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

        if (!fingerprint) {
            return NextResponse.json({ error: "Missing fingerprint" }, { status: 400 });
        }

        const now = Date.now();
        const fingerprintKey = `fp_${fingerprint}`;
        const ipKey = `ip_${ip}`;

        const [fingerprintUsage, ipUsage] = await Promise.all([
            readUsageRecord(fingerprintKey, now),
            readUsageRecord(ipKey, now),
        ]);

        if (fingerprintUsage.creditsUsed >= MAX_CREDITS) {
            return NextResponse.json(
                { allowed: false, reason: "fingerprint_limit" },
                { status: 429 }
            );
        }

        if (ipUsage.creditsUsed >= MAX_CREDITS) {
            return NextResponse.json(
                { allowed: false, reason: "ip_limit" },
                { status: 429 }
            );
        }

        const writes = [
            docClient.send(
                new PutCommand({
                    TableName: TABLE_NAME,
                    Item: {
                        id: fingerprintKey,
                        creditsUsed: fingerprintUsage.creditsUsed + 1,
                        lastUsed: now,
                        lastReset: fingerprintUsage.lastReset,
                    },
                })
            ),
            docClient.send(
                new PutCommand({
                    TableName: TABLE_NAME,
                    Item: {
                        id: ipKey,
                        creditsUsed: ipUsage.creditsUsed + 1,
                        lastUsed: now,
                        lastReset: ipUsage.lastReset,
                    },
                })
            ),
        ];

        await Promise.all(writes);

        return NextResponse.json({
            allowed: true,
            remaining: Math.max(0, MAX_CREDITS - (fingerprintUsage.creditsUsed + 1)),
        });
    } catch (error) {
        console.error("Error using credit:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
