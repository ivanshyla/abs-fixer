import { NextResponse } from 'next/server';

export async function GET() {
  const appKey = process.env.APP_AWS_ACCESS_KEY_ID;
  const appSecret = process.env.APP_AWS_SECRET_ACCESS_KEY;
  const region = process.env.APP_AWS_REGION;

  return NextResponse.json({
    hasAppAwsKey: Boolean(appKey),
    hasAppAwsSecret: Boolean(appSecret),
    appRegion: region || null,
    envSample: Object.keys(process.env || {}).filter((key) =>
      key.startsWith('APP_AWS_')
    ),
  });
}

