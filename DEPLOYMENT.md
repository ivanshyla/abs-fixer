# Deployment Guide

## Pre-Deployment Checklist

### 1. Supabase Setup

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the schema from `supabase/schema.sql`
4. Go to Settings → API to get:
   - Project URL
   - Anon (public) key
5. Save these for environment variables

### 2. Stripe Setup

1. Go to [https://stripe.com](https://stripe.com)
2. Create an account (or use existing)
3. Go to Developers → API keys:
   - Get **Publishable key** (starts with `pk_`)
   - Get **Secret key** (starts with `sk_`)
4. For production, switch to **Live mode** (toggle in top right)
5. Save these keys for environment variables

### 3. Stripe Webhook Setup

**After deployment**, you need to set up a webhook:

1. Go to Developers → Webhooks in Stripe Dashboard
2. Click "Add endpoint"
3. Enter your deployed URL: `https://yourdomain.com/api/stripe-webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)
6. Add this to your environment variables

### 4. Fal.ai API Key

1. Go to [https://fal.ai](https://fal.ai)
2. Sign up or log in
3. Go to API Keys
4. Generate a new key
5. Save for environment variables

## Deploy to Vercel (Recommended)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Production ready"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `abs-fixer` directory if it's in a monorepo

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```
FAL_AI_API_KEY=your_fal_ai_key
STRIPE_SECRET_KEY=sk_live_... (use LIVE key for production)
STRIPE_WEBHOOK_SECRET=whsec_... (add after webhook setup)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (use LIVE key)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Deploy

Click "Deploy" - Vercel will build and deploy automatically.

### Step 5: Set Up Stripe Webhook

1. Copy your deployed URL (e.g., `https://abs-fixer.vercel.app`)
2. Follow **Step 3** from Stripe Setup above
3. Add the webhook secret to Vercel environment variables
4. Redeploy (Vercel will auto-redeploy when you add env vars)

### Step 6: Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Stripe webhook URL to use custom domain

## Testing Payment Flow

### Test Mode (Before Production)

1. Use Stripe **test keys** (`pk_test_...` and `sk_test_...`)
2. Use test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Any future expiry date, any CVC

### Production Mode

1. Switch to Stripe **live keys**
2. Real payments will be processed
3. Monitor Stripe Dashboard for payments

## Monitoring

### Stripe Dashboard
- Monitor payments in real-time
- View failed payments
- Issue refunds if needed

### Supabase Dashboard
- View generations table for all AI requests
- Check user ratings to improve model
- Monitor payment records

### Vercel Logs
- View application logs
- Monitor API errors
- Check performance

## Post-Deployment

### 1. Test the Full Flow

1. Upload a photo
2. Draw mask
3. Select abs type
4. Enter email
5. Make a test payment
6. Verify generation works
7. Rate the result
8. Check database records

### 2. Monitor Performance

- Check Vercel Analytics
- Monitor API response times
- Watch for errors in logs

### 3. Collect Feedback

- User ratings in database
- Email feedback from users
- Iterate on prompts based on ratings

## Costs

### Monthly Estimates (based on 100 generations/month)

- **Vercel**: Free tier (likely sufficient)
- **Supabase**: Free tier (likely sufficient)
- **Fal.ai**: ~$0.05-0.15 per generation = $5-15/month
- **Stripe**: 2.9% + $0.30 per transaction = ~$17/month on $500 revenue

**Revenue**: 100 generations × $5 = $500/month
**Costs**: ~$25-35/month
**Profit**: ~$465-475/month

## Scaling

As you grow:

1. **Supabase**: Upgrade to Pro ($25/mo) for better performance
2. **Vercel**: Stay on free tier (handles good traffic)
3. **CDN**: Consider Cloudflare for image delivery
4. **Monitoring**: Add Sentry for error tracking

## Troubleshooting

### Payment not processing
- Check Stripe webhook is configured
- Verify webhook secret is correct
- Check Vercel logs for errors

### Generation fails
- Check Fal.ai API key is valid
- Verify API limits not exceeded
- Check image/mask format

### Database errors
- Verify Supabase connection
- Check API keys are correct
- Ensure schema is up to date

## Support

For issues, check:
1. Vercel logs
2. Stripe webhook logs
3. Supabase logs
4. Browser console (client errors)

