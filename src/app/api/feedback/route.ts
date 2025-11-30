import { NextRequest, NextResponse } from 'next/server';
import { dynamo, TABLE_NAMES } from '@/lib/aws';
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(req: NextRequest) {
    try {
        const { generationId, feedback } = await req.json();

        if (!generationId || !feedback) {
            return NextResponse.json(
                { error: 'Missing generationId or feedback' },
                { status: 400 }
            );
        }

        if (feedback !== 'like' && feedback !== 'dislike') {
            return NextResponse.json(
                { error: 'Invalid feedback value. Must be "like" or "dislike"' },
                { status: 400 }
            );
        }

        const feedbackTimestamp = new Date().toISOString();

        // Update generations table
        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAMES.GENERATIONS,
            Key: { id: generationId },
            UpdateExpression: "set feedback = :feedback, feedbackTimestamp = :timestamp",
            ExpressionAttributeValues: {
                ":feedback": feedback,
                ":timestamp": feedbackTimestamp,
            },
        }));

        // Update training data table
        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAMES.TRAINING_DATA,
            Key: { id: generationId },
            UpdateExpression: "set feedback = :feedback",
            ExpressionAttributeValues: {
                ":feedback": feedback,
            },
        }));

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Feedback submission error:', message);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
