import { NextRequest, NextResponse } from 'next/server';
import { dynamo, TABLE_NAMES } from '@/lib/aws';
import { PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { getPromptForAbsType } from '@/lib/prompts';

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
      // promptUsed, // Client no longer sends this
      strength,
      seed,
      paymentId,
      provider,
      intensity, // Client sends intensity now
    } = await req.json();

    const generationId = uuidv4();
    const createdAt = new Date().toISOString();

    // Resolve prompt server-side
    const promptUsed = getPromptForAbsType(absType);

    const generationParams = {
      prompt: promptUsed,
      strength,
      seed,
      provider: provider || modelUsed,
      absType,
      intensity,
    };

    const generation = {
      id: generationId,
      user_id: userId || 'anonymous',
      abs_type: absType,
      gender: gender || null,
      input_image_url: inputImageUrl || null,
      mask_image_url: maskImageUrl || null,
      output_image_url: outputImageUrl,
      model_used: modelUsed,
      prompt_used: promptUsed,
      strength: strength || null,
      seed: seed || null,
      payment_id: paymentId || null,
      user_rating: 0,
      created_at: createdAt,
      // New feedback fields
      feedback: null,
      feedbackTimestamp: null,
      generationParams,
      imageMetadata: null,
    };

    // Credit Deduction Logic
    if (paymentId && paymentId !== 'dev_bypass') {
      // 1. Check credits
      const paymentResponse = await dynamo.send(new GetCommand({
        TableName: TABLE_NAMES.PAYMENTS,
        Key: { id: paymentId }
      }));

      const payment = paymentResponse.Item;

      if (!payment) {
        throw new Error('Payment record not found');
      }

      const creditsTotal = payment.credits_total || 1; // Default to 1 if not set (legacy)
      const creditsUsed = payment.credits_used || 0;

      if (creditsUsed >= creditsTotal) {
        throw new Error('No credits remaining for this payment');
      }

      // 2. Increment credits used
      await dynamo.send(new UpdateCommand({
        TableName: TABLE_NAMES.PAYMENTS,
        Key: { id: paymentId },
        UpdateExpression: "set credits_used = if_not_exists(credits_used, :zero) + :inc",
        ExpressionAttributeValues: {
          ":inc": 1,
          ":zero": 0
        }
      }));
    }

    // Save to generations table
    await dynamo.send(new PutCommand({
      TableName: TABLE_NAMES.GENERATIONS,
      Item: generation
    }));

    // Save to training data table for ML dataset (Non-blocking)
    try {
      await dynamo.send(new PutCommand({
        TableName: TABLE_NAMES.TRAINING_DATA,
        Item: {
          id: generationId,
          inputImageUrl: inputImageUrl || null,
          maskUrl: maskImageUrl || null,
          outputImageUrl,
          prompt: promptUsed,
          strength,
          seed,
          provider: provider || modelUsed,
          absType,
          feedback: null,
          createdAt,
        }
      }));
    } catch (trainingDataError) {
      console.warn('Failed to save to training data table:', trainingDataError);
      // Continue execution - do not fail the request
    }

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

