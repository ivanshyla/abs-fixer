import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type User = {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Generation = {
  id: string;
  user_id: string | null;
  abs_type: string;
  gender: string | null;
  input_image_url: string | null;
  mask_image_url: string | null;
  output_image_url: string | null;
  model_used: string;
  prompt_used: string | null;
  strength: number | null;
  seed: number | null;
  user_rating: -1 | 0 | 1 | null; // -1 = dislike, 0 = no rating, 1 = like
  user_feedback: string | null;
  payment_id: string | null;
  created_at: string;
  rated_at: string | null;
};

export type Payment = {
  id: string;
  user_id: string | null;
  stripe_payment_intent_id: string;
  stripe_payment_status: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

