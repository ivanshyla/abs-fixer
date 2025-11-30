import { NextRequest, NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";
import { getPromptForAbsType, getGenerationParams } from "@/lib/prompts";
import { validateImageDataUrl } from "@/lib/imageValidation";

// Configure the client with the API key
fal.config({
  credentials: process.env.FAL_KEY || process.env.FAL_AI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { absType, intensity, image, mask, seed } = body;

    if (!absType || !image || !mask) {
      return NextResponse.json(
        { error: "Missing required fields: absType, image, mask" },
        { status: 400 }
      );
    }

    // Resolve prompt and params server-side
    const prompt = getPromptForAbsType(absType);
    const params = getGenerationParams(absType, intensity);

    console.log("Fal.ai Client Request:", { absType, intensity, promptLength: prompt.length });

    // Helper to upload Data URL to Fal Storage
    const uploadToFal = async (dataUrl: string, label: string) => {
      try {
        const validated = validateImageDataUrl(dataUrl, label);
        console.log(`${label} Content-Type: ${validated.mimeType}, Size: ${validated.size}`);

        // Upload to Fal Storage (pass Buffer directly)
        console.log(`${label} Uploading Buffer...`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const url = await fal.storage.upload(validated.buffer as any);
        console.log(`${label} Uploaded to: ${url}`);
        return url;
      } catch (err: unknown) {
        console.error(`Error processing ${label}:`, err);
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to process ${label}: ${message}`);
      }
    };

    // Upload image and mask
    const [imageUrl, maskUrl] = await Promise.all([
      uploadToFal(image, "image"),
      uploadToFal(mask, "mask")
    ]);

    // Run inference
    console.log("Starting inference...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await fal.subscribe("fal-ai/flux-general/inpainting", {
      input: {
        image_url: imageUrl,
        mask_url: maskUrl,
        prompt: prompt,
        num_inference_steps: params.num_inference_steps,
        guidance_scale: params.guidance_scale,
        strength: params.strength,
        seed: seed,
        enable_safety_checker: true
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
      model_used: "Fal.ai Flux (Client Lib)",
      seed: result.seed // Return seed if available
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("API route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
