import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { data, error } = await supabase
      .from('generations')
      .insert({
        user_id: userId || null,
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
        user_rating: 0, // No rating yet
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, generation: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Save generation error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

