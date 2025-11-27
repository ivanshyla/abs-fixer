import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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

        const now = Date.now();
        const fingerprintKey = `fp_${fingerprint}`;
        const ipKey = `ip_${ip}`;

        // Update fingerprint record
        await docClient.send(
            new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { id: fingerprintKey },
                UpdateExpression: "SET creditsUsed = if_not_exists(creditsUsed, :zero) + :inc, lastUsed = :now",
                ExpressionAttributeValues: {
                    ":zero": 0,
                    ":inc": 1,
                    ":now": now,
                },
            })
        );

        // Update IP record with reset logic
        const ipRecord = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { id: ipKey },
            })
        );

        if (ipRecord.Item) {
            const lastReset = ipRecord.Item.lastReset || 0;
            const shouldReset = now - lastReset > RATE_LIMIT_WINDOW;

            if (shouldReset) {
                // Reset counter
                await docClient.send(
                    new PutCommand({
                        TableName: TABLE_NAME,
                        Item: {
                            id: ipKey,
                            creditsUsed: 1,
                            lastReset: now,
                            lastUsed: now,
                        },
                    })
                );
            } else {
                // Increment counter
                await docClient.send(
                    new UpdateCommand({
                        TableName: TABLE_NAME,
                        Key: { id: ipKey },
                        UpdateExpression: "SET creditsUsed = creditsUsed + :inc, lastUsed = :now",
                        ExpressionAttributeValues: {
                            ":inc": 1,
                            ":now": now,
                        },
                    })
                );
            }
        } else {
            // Create new IP record
            await docClient.send(
                new PutCommand({
                    TableName: TABLE_NAME,
                    Item: {
                        id: ipKey,
                        creditsUsed: 1,
                        lastReset: now,
                        lastUsed: now,
                    },
                })
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error using credit:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
