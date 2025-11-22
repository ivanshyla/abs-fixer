import { NextRequest, NextResponse } from 'next/server';
import { dynamo, TABLE_NAMES } from '@/lib/aws';
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(req: NextRequest) {
  try {
    const { generationId, rating, feedback } = await req.json();

    if (!generationId) {
      return NextResponse.json(
        { error: 'Missing generationId' },
        { status: 400 }
      );
    }

    if (rating !== -1 && rating !== 1) {
      return NextResponse.json(
        { error: 'Rating must be -1 (dislike) or 1 (like)' },
        { status: 400 }
      );
    }

    // Update item in DynamoDB
    const result = await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAMES.GENERATIONS,
      Key: { id: generationId },
      UpdateExpression: "set user_rating = :r, user_feedback = :f, rated_at = :t",
      ExpressionAttributeValues: {
        ":r": rating,
        ":f": feedback || null,
        ":t": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW"
    }));

    return NextResponse.json({ success: true, generation: result.Attributes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Rate generation error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

