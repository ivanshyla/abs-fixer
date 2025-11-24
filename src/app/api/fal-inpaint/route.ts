import { NextRequest, NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";

// Configure the client with the API key
fal.config({
  credentials: process.env.FAL_KEY || process.env.FAL_AI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, image, mask, strength, seed } = body;

    if (!prompt || !image || !mask) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, image, mask" },
        { status: 400 }
      );
    }

    console.log("Fal.ai Client Request:", { prompt, strength });

    // Helper to upload Data URL to Fal Storage
    const uploadToFal = async (dataUrl: string, label: string) => {
      try {
        console.log(`Processing ${label} (Length: ${dataUrl?.length})`);

        // Parse Data URL manually to avoid fetch() issues in Node
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          console.error(`Invalid Data URL format for ${label}. Start: ${dataUrl?.substring(0, 50)}...`);
          throw new Error(`Invalid Data URL format for ${label}`);
        }

        const contentType = matches[1];
        const b64Data = matches[2];
        console.log(`${label} Content-Type: ${contentType}, Base64 Length: ${b64Data.length}`);

        const buffer = Buffer.from(b64Data, 'base64');
        console.log(`${label} Buffer created. Size: ${buffer.length}`);

        // Upload to Fal Storage (pass Buffer directly)
        console.log(`${label} Uploading Buffer...`);
        const url = await fal.storage.upload(buffer as any);
        console.log(`${label} Uploaded to: ${url}`);
        return url;
      } catch (err: any) {
        console.error(`Error processing ${label}:`, err);
        throw new Error(`Failed to process ${label}: ${err.message}`);
      }
    };

    // Upload image and mask
    const [imageUrl, maskUrl] = await Promise.all([
      uploadToFal(image, "image"),
      uploadToFal(mask, "mask")
    ]);

    // Run inference
    console.log("Starting inference...");
    const result: any = await fal.subscribe("fal-ai/flux-general/inpainting", {
      input: {
        image_url: imageUrl,
        mask_url: maskUrl,
        prompt: prompt,
        num_inference_steps: 28,
        guidance_scale: 2.5,
        strength: strength || 0.4,
        seed: seed,
        enable_safety_checker: false
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log("Inference result:", result);

    // Extract image URL from result
    let outputImageUrl = null;
    if (result.images && result.images[0] && result.images[0].url) {
      outputImageUrl = result.images[0].url;
    } else if (result.image && result.image.url) {
      outputImageUrl = result.image.url;
    }

    if (!outputImageUrl) {
      throw new Error("No image URL in response");
    }

    return NextResponse.json({
      image: outputImageUrl,
      model_used: "Fal.ai Flux (Client Lib)"
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("API route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
