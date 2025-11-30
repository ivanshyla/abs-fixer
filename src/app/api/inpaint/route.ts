import { NextRequest } from "next/server";
import Replicate from "replicate";
import { validateImageDataUrl } from "@/lib/imageValidation";

const token = process.env.REPLICATE_API_TOKEN;
const replicate = new Replicate({ auth: token ?? "" });

type InpaintRequest = {
  image: string;
  mask: string;
  prompt: string;
  strength?: number;
  negative_prompt?: string;
  // optional overrides for grid-testing
  num_inference_steps?: number;
  guidance_scale?: number;
  width?: number;
  height?: number;
  mask_blur?: number;
  mask_expand?: number;
  seed?: number;
};

export async function POST(req: NextRequest) {
  try {
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing REPLICATE_API_TOKEN on server. Add it to .env.local and restart." }),
        { status: 500 }
      );
    }

    const json = await req.json() as Partial<InpaintRequest>;
    const body: InpaintRequest = {
      image: String(json.image || ""),
      mask: String(json.mask || ""),
      prompt: String(json.prompt || ""),
      strength: json.strength !== undefined ? Number(json.strength) : 0.35,
      negative_prompt: json.negative_prompt ? String(json.negative_prompt) : undefined,
      num_inference_steps: json.num_inference_steps !== undefined ? Number(json.num_inference_steps) : undefined,
      guidance_scale: json.guidance_scale !== undefined ? Number(json.guidance_scale) : undefined,
      width: json.width !== undefined ? Number(json.width) : undefined,
      height: json.height !== undefined ? Number(json.height) : undefined,
      mask_blur: json.mask_blur !== undefined ? Number(json.mask_blur) : undefined,
      mask_expand: json.mask_expand !== undefined ? Number(json.mask_expand) : undefined,
      seed: json.seed !== undefined ? Number(json.seed) : undefined,
    };

    const { image, mask, prompt, strength = 0.35, negative_prompt } = body || {};
    if (!image || !mask || !prompt) {
      return new Response(JSON.stringify({ error: "Missing image/mask/prompt" }), { status: 400 });
    }

    console.log("Input validation passed:", { 
      imageLength: image.length, 
      maskLength: mask.length, 
      prompt, 
      strength 
    });

    const negativePrompt =
      (negative_prompt ?? "plastic skin, CGI, cartoon, harsh contrast, unnatural highlights, artifacts, low quality, blurry");

    // Convert data URLs to Blobs for Replicate
    console.log("Converting image data URL to blob...");
    const validatedImage = validateImageDataUrl(image, "image");
    const validatedMask = validateImageDataUrl(mask, "mask");

    const imageBlob = new Blob([validatedImage.buffer], { type: validatedImage.mimeType });
    const imageFile = await replicate.files.create(imageBlob);
    console.log("Image uploaded:", imageFile.urls.get);
    
    console.log("Converting mask data URL to blob...");  
    const maskBlob = new Blob([validatedMask.buffer], { type: validatedMask.mimeType });
    const maskFile = await replicate.files.create(maskBlob);
    console.log("Mask uploaded:", maskFile.urls.get);
    
    const imageUrlForModel = imageFile.urls.get;
    const maskUrlForModel = maskFile.urls.get;

    // Use SDXL Inpainting - latest working version
    const model = "stability-ai/sdxl-inpainting:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

    console.log("Calling Replicate model:", model);
    console.log("Replicate input:", {
      prompt,
      negative_prompt: negativePrompt,
      imageUrl: imageUrlForModel,
      maskUrl: maskUrlForModel,
      num_inference_steps: Number(body.num_inference_steps ?? 26),
      guidance_scale: Number(body.guidance_scale ?? 5.8),
      strength: Math.min(0.55, Math.max(0.1, Number(strength))),
      width: 1024,
      height: 1024,
      seed: body.seed,
    });

    const output = await replicate.run(model, {
      input: {
        prompt: `${prompt}, keep original colors and lighting, realistic skin tone, no texture change outside abs, no patterns, no neon colors, smooth blend, natural look, high fidelity`,
        negative_prompt: negativePrompt,
        image: imageUrlForModel,
        mask: maskUrlForModel,
        num_inference_steps: Number(body.num_inference_steps ?? 26),
        guidance_scale: Number(body.guidance_scale ?? 5.8),
        strength: Math.min(0.55, Math.max(0.1, Number(strength))),
        width: Number(body.width ?? 1024),
        height: Number(body.height ?? 1024),
        mask_blur: Number(body.mask_blur ?? 10),
        mask_expand: Number(body.mask_expand ?? 2),
        seed: body.seed,
      },
    });

    console.log("Replicate response:", output);
    console.log("Replicate response type:", typeof output);
    console.log("Replicate response keys:", Object.keys(output || {}));
    console.log("Replicate response length:", Array.isArray(output) ? output.length : 'not array');

    // Handle ReadableStream response
    const out = output as unknown;
    let imageUrl: string | null = null;
    
    if (Array.isArray(out)) {
      const first = out[0] as unknown;
      console.log("First array element type:", typeof first);
      console.log("First array element:", first);
      
      if (typeof first === "string") {
        // Check if it's already a URL or base64
        if (first.startsWith('http') || first.startsWith('data:')) {
          imageUrl = first;
          console.log("Found image URL:", imageUrl);
        } else {
          // It's raw base64 data, convert to data URL
          imageUrl = `data:image/png;base64,${first}`;
          console.log("Converted raw base64 to data URL");
        }
      } else if (first && typeof first === "object") {
        // Handle ReadableStream - read it as text
        if ('getReader' in (first as Record<string, unknown>)) {
          console.log("Handling ReadableStream...");
          const reader = (first as { getReader: () => ReadableStreamDefaultReader<Uint8Array> }).getReader();
          const chunks: Uint8Array[] = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }
          
          const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
          let offset = 0;
          for (const chunk of chunks) {
            concatenated.set(chunk, offset);
            offset += chunk.length;
          }
          
          const base64 = Buffer.from(concatenated).toString('base64');
          imageUrl = `data:image/png;base64,${base64}`;
          console.log("Converted ReadableStream to data URL");
        }
      }
    } else if (typeof out === "string") {
      // Direct string response
      if (out.startsWith('http') || out.startsWith('data:')) {
        imageUrl = out;
      } else {
        imageUrl = `data:image/png;base64,${out}`;
      }
      console.log("Handled direct string response");
    }

    if (imageUrl) {
      console.log("Returning image URL");
      return new Response(JSON.stringify({ image: imageUrl }), { status: 200 });
    }

    console.log("No valid image found in response");
    return new Response(JSON.stringify({ error: "No image in Replicate response" }), { status: 502 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "inpaint failed";
    console.error("/api/inpaint error:", err);
    console.error("Error stack:", err instanceof Error ? err.stack : "No stack");
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}


