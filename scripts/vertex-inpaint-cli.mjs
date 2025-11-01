#!/usr/bin/env node

// Minimal Vertex AI Images inpainting CLI.
// Usage:
//   node scripts/vertex-inpaint-cli.mjs \
//     --input path/to/photo.jpg \
//     --mask path/to/mask.png \
//     --out out.png \
//     --prompt "natural abdominal definition" \
//     [--negative "plastic skin, CGI"] [--strength 0.25] [--steps 28] [--guidance 5.0]
//   Env required: GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT, GOOGLE_VERTEX_LOCATION

import fs from 'node:fs/promises';
import path from 'node:path';
import { GoogleAuth } from 'google-auth-library';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith('--')) {
      const name = key.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[name] = val;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Vertex AI Inpainting CLI\n\n` +
    `Required:\n` +
    `  --input <file>     Source image (jpg/png)\n` +
    `  --mask <file>      Binary mask (white=inpaint area, black=keep)\n` +
    `  --out <file>       Output file path (png/jpg)\n` +
    `  --prompt <text>    Positive prompt\n\n` +
    `Environment:\n` +
    `  GOOGLE_APPLICATION_CREDENTIALS  Path to service account JSON\n` +
    `  GOOGLE_CLOUD_PROJECT            Project ID\n` +
    `  GOOGLE_VERTEX_LOCATION          Region (e.g. us-central1)\n\n` +
    `Optional:\n` +
    `  --negative <text>   Negative prompt\n` +
    `  --strength <0..1>   Edit strength (default 0.25)\n` +
    `  --steps <int>       Inference steps (default 28)\n` +
    `  --guidance <float>  Guidance scale (default 5.0)\n`);
}

function ensureEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

async function fileToBase64(filePath) {
  const buf = await fs.readFile(filePath);
  return buf.toString('base64');
}

async function getAccessToken() {
  const keyfilePath = path.resolve(process.cwd(), ensureEnv('GOOGLE_APPLICATION_CREDENTIALS'));

  const auth = new GoogleAuth({
    keyFile: keyfilePath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  return await client.getAccessToken();
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.input || !args.mask || !args.out || !args.prompt) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const projectId = ensureEnv('GOOGLE_CLOUD_PROJECT');
  const location = ensureEnv('GOOGLE_VERTEX_LOCATION');
  ensureEnv('GOOGLE_APPLICATION_CREDENTIALS');

  const [imageB64, maskB64] = await Promise.all([
    fileToBase64(path.resolve(args.input)),
    fileToBase64(path.resolve(args.mask))
  ]);

  const token = await getAccessToken();

  // Images API predict endpoint (Imagen-based)
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration:predict`;

  const body = {
    instances: [
      {
        prompt: String(args.prompt),
        image: { bytesBase64Encoded: imageB64 },
        mask: {
          image: { bytesBase64Encoded: maskB64 }
        }
      }
    ],
    parameters: {
      negativePrompt: args.negative ? String(args.negative) : undefined,
      sampleCount: 1
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Vertex request failed: ${res.status} ${res.statusText} - ${txt}`);
  }

  const data = await res.json();
  const pred = Array.isArray(data.predictions) ? data.predictions[0] : undefined;
  if (!pred) throw new Error('No predictions in response');

  // Response commonly returns { bytesBase64Encoded, mimeType } or nested under 'image'. Handle both.
  const imageOutB64 = pred.bytesBase64Encoded || pred.image?.bytesBase64Encoded;
  if (!imageOutB64) {
    throw new Error(`Unexpected response shape. Keys: ${Object.keys(pred)}`);
  }

  const outPath = path.resolve(args.out);
  await fs.writeFile(outPath, Buffer.from(imageOutB64, 'base64'));
  console.log(`Saved: ${outPath}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});


