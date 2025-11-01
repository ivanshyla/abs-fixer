import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { data, error } = await supabase
      .from('generations')
      .update({
        user_rating: rating,
        user_feedback: feedback || null,
        rated_at: new Date().toISOString(),
      })
      .eq('id', generationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, generation: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Rate generation error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

