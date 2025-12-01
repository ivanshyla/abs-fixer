# ABS Fixer - AI-Powered Fitness Enhancement

Transform your physique with AI-powered inpainting technology.

## Features

- 🎨 **Smart Brush Tool** - Paint the area you want to enhance
- 💪 **Multiple Styles** - Natural Fit, Athletic, or Defined abs
- 💳 **Secure Payments** - Stripe integration ($5 per generation)
- ⭐ **User Feedback** - Rate results to help improve the AI
- 📊 **Database Tracking** - All generations and ratings stored for learning

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Canvas**: Konva.js for drawing interface
- **AI**: Fal.ai FLUX LoRA Inpainting
- **Payment**: Stripe
- **Database**: Supabase (PostgreSQL)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Run the schema from `supabase/schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key

### 3. Set Up Stripe

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Set up a webhook endpoint pointing to your `/api/stripe-webhook`

### 4. Configure Environment Variables

Create a `.env.local` file:

```env
# Fal.ai API
FAL_AI_API_KEY=your_fal_ai_key_here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Internal analytics
ANALYTICS_API_KEY=choose_a_strong_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### Tables

- **users** - User accounts with email and Stripe customer ID
- **payments** - Payment tracking with Stripe
- **generations** - Image generations with AI parameters and user ratings

See `supabase/schema.sql` for full schema.

## User Flow

1. **Upload Photo** - User uploads a photo of their torso
2. **Draw Mask** - User paints the abs area with brush tool
3. **Choose Style** - Select Natural Fit, Athletic, or Defined
4. **Enter Email** - Provide email for result delivery
5. **Pay** - Secure $5 payment via Stripe
6. **Generate** - AI enhances the photo (15-30 seconds)
7. **Rate Result** - User rates satisfaction (thumbs up/down)
8. **Download** - User downloads enhanced photo

## API Routes

- `POST /api/create-payment-intent` - Initialize Stripe payment
- `POST /api/stripe-webhook` - Handle Stripe webhooks
- `POST /api/fal-inpaint` - Generate enhanced image
- `POST /api/save-generation` - Save generation to database
- `POST /api/rate-generation` - Save user rating

## CLI Tools (Optional)

For testing purposes, you can use CLI tools:

```bash
# Vertex AI inpainting (requires Google Cloud setup)
npm run vertex:inpaint -- --input ./photo.jpg --mask ./mask.png --out ./result.png --prompt "natural abs"
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in your production environment:

- Use production Stripe keys (not test keys)
- Use production Supabase project
- Keep `FAL_AI_API_KEY` secure

### Stripe Webhook Setup

After deployment, update your Stripe webhook endpoint to:
```
https://yourdomain.com/api/stripe-webhook
```

## Pricing

- **Per Generation**: $5.00 USD
- Includes: AI enhancement, unlimited downloads, result stored for 30 days

## Support

For issues or questions, contact: your@email.com

## License

MIT
