import { NextRequest, NextResponse } from 'next/server';
import { dynamo, TABLE_NAMES } from '@/lib/aws';
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      absType,
      gender,
      inputImageUrl,
      maskImageUrl,
      outputImageUrl,
      modelUsed,
      promptUsed,
      strength,
      seed,
      paymentId,
    } = await req.json();

    const generationId = uuidv4();
    const generation = {
      id: generationId,
      user_id: userId || 'anonymous',
      abs_type: absType,
      gender: gender || null,
      input_image_url: inputImageUrl || null,
      mask_image_url: maskImageUrl || null,
      output_image_url: outputImageUrl,
      model_used: modelUsed,
      prompt_used: promptUsed || null,
      strength: strength || null,
      seed: seed || null,
      payment_id: paymentId || null,
      user_rating: 0,
      created_at: new Date().toISOString(),
    };

    await dynamo.send(new PutCommand({
      TableName: TABLE_NAMES.GENERATIONS,
      Item: generation
    }));

    return NextResponse.json({ success: true, generation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Save generation error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

