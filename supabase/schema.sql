-- ABS Fixer Database Schema
-- PostgreSQL/Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (can be linked to Supabase Auth or custom)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generations table (stores each image generation + user rating)
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Input data
  abs_type TEXT NOT NULL, -- e.g. "natural_fit", "athletic", "defined"
  gender TEXT, -- "male" or "female"
  
  -- Images (stored as URLs or base64)
  input_image_url TEXT,
  mask_image_url TEXT,
  output_image_url TEXT,
  
  -- AI parameters used
  model_used TEXT DEFAULT 'fal-ai/flux-lora/inpainting',
  prompt_used TEXT,
  strength REAL,
  seed BIGINT,
  
  -- User feedback
  user_rating INTEGER CHECK (user_rating IN (-1, 0, 1)), -- -1 = dislike, 0 = no rating, 1 = like
  user_feedback TEXT, -- optional text feedback
  
  -- Payment info
  payment_id UUID REFERENCES payments(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rated_at TIMESTAMPTZ
);

-- Payments table (Stripe payment tracking)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_payment_status TEXT NOT NULL, -- "succeeded", "pending", "failed"
  
  amount INTEGER NOT NULL, -- in cents (e.g. 500 = $5.00)
  currency TEXT DEFAULT 'usd',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_user_rating ON generations(user_rating);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_intent_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

