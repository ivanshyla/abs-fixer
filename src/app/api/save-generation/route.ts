import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dynamo, TABLE_NAMES } from '@/lib/aws';
import { PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { getPromptForAbsType } from '@/lib/prompts';

const hashPaymentToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function POST(req: NextRequest) {
  try {
    const {
      absType,
      gender,
      inputImageUrl,
      maskImageUrl,
      outputImageUrl,
      modelUsed,
      // promptUsed, // Client no longer sends this
      strength,
      seed,
      paymentId: rawPaymentId,
      provider,
      intensity, // Client sends intensity now
      paymentToken,
    } = await req.json();

    const paymentId = rawPaymentId ?? null;
    const bypassPaymentChecks = !paymentId || paymentId === 'dev_bypass';

    let paymentOwnerId = 'anonymous';
    let paymentRecord: Record<string, unknown> | null = null;

    if (!bypassPaymentChecks) {
      if (!paymentToken) {
        throw new Error('Missing payment token. Please restart checkout.');
      }

      const paymentResponse = await dynamo.send(new GetCommand({
        TableName: TABLE_NAMES.PAYMENTS,
        Key: { id: paymentId }
      }));

      paymentRecord = paymentResponse.Item || null;

      if (!paymentRecord) {
        throw new Error('Payment record not found');
      }

      const storedHash = paymentRecord.payment_access_token_hash as string | undefined;
      const expiresAt = paymentRecord.payment_access_token_expires_at as string | undefined;

      if (!storedHash || !expiresAt) {
        throw new Error('Payment session is not authorized. Please start over.');
      }

      const providedHash = hashPaymentToken(paymentToken);
      const storedHashBuffer = Buffer.from(storedHash, 'hex');
      const providedHashBuffer = Buffer.from(providedHash, 'hex');

      if (storedHashBuffer.length !== providedHashBuffer.length || !crypto.timingSafeEqual(storedHashBuffer, providedHashBuffer)) {
        throw new Error('Invalid payment token');
      }

      if (new Date(expiresAt).getTime() < Date.now()) {
        throw new Error('Payment session expired. Please restart checkout.');
      }

      const paymentStatus = paymentRecord.stripe_payment_status as string | undefined;

      if (paymentStatus !== 'succeeded') {
        throw new Error('Payment has not completed yet. Please wait for confirmation.');
      }

      paymentOwnerId = (paymentRecord.user_id as string | undefined) || 'anonymous';
    }
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
      user_id: paymentOwnerId,
      abs_type: absType,
      gender: gender || null,
      input_image_url: inputImageUrl || null,
      mask_image_url: maskImageUrl || null,
      output_image_url: outputImageUrl,
      model_used: modelUsed,
      prompt_used: promptUsed,
      strength: strength || null,
      seed: seed || null,
      payment_id: bypassPaymentChecks ? null : paymentId,
      user_rating: 0,
      created_at: createdAt,
      // New feedback fields
      feedback: null,
      feedbackTimestamp: null,
      generationParams,
      imageMetadata: null,
    };

    // Credit Deduction Logic
    if (!bypassPaymentChecks && paymentRecord) {
      const creditsTotal = (paymentRecord.credits_total as number | undefined) || 1; // Default to 1 if not set (legacy)
      const creditsUsed = (paymentRecord.credits_used as number | undefined) || 0;

      if (creditsUsed >= creditsTotal) {
        throw new Error('No credits remaining for this payment');
      }

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

