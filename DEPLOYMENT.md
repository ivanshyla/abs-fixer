# AWS Deployment Guide

## 1. Push Code to GitHub
Ensure your latest code is pushed to your repository.
```bash
git add .
git commit -m "Ready for AWS deployment"
git push origin main
```

## 2. Deploy to AWS Amplify
1. Go to the [AWS Amplify Console](https://eu-north-1.console.aws.amazon.com/amplify/home?region=eu-north-1).
2. Click **"Create new app"** (or "Host web app").
3. Select **GitHub** and click **Next**.
4. Authorize AWS to access your GitHub account.
5. Select your repository (`abs-fixer`) and branch (`main`).
6. Click **Next**.

## 3. Configure Build Settings
Amplify should automatically detect the `amplify.yml` file in the project.
- **App name**: `abs-fixer` (or your choice).
- **Build settings**: Ensure it uses the detected `amplify.yml`.

## 4. Environment Variables (CRITICAL)
In the "Advanced settings" section (or after deployment in App settings > Environment variables), add the following keys:

| Key | Value |
|-----|-------|
| `AWS_ACCESS_KEY_ID` | `YOUR_AWS_ACCESS_KEY_ID` |
| `AWS_SECRET_ACCESS_KEY` | `YOUR_AWS_SECRET_ACCESS_KEY` |
| `AWS_REGION` | `eu-north-1` |
| `FAL_KEY` | `YOUR_FAL_KEY` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (Get from Stripe Dashboard) |
| `STRIPE_SECRET_KEY` | (Get from Stripe Dashboard) |
| `STRIPE_WEBHOOK_SECRET` | (Get from Stripe Dashboard after webhook setup) |

*Note: For Stripe keys, use the Test keys initially (`pk_test_...`, `sk_test_...`) to verify, then switch to Live keys (`pk_live_...`, `sk_live_...`) for real payments.*

## 5. Deploy
Click **Save and Deploy**. Amplify will build your app and deploy it to a global CDN.

## 6. Domain Setup (Optional)
Once deployed:
1. Go to **Domain management** in the Amplify sidebar.
2. Click **Add domain**.
3. Enter your domain (e.g., `super-abs.com`).
4. Follow the verification steps (AWS will guide you to update DNS records).

## 7. Troubleshooting
- **Build Fails**: Check the "Build" logs in Amplify. Ensure `npm install` succeeded.
- **Database Errors**: Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct in Environment Variables.
- **Payment Errors**: Ensure Stripe keys are correct.


