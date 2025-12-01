import { NextRequest, NextResponse } from "next/server";
import { getPromptForAbsType, getNegativePrompt, getGenerationParams } from "@/lib/prompts";
import { validateImageDataUrl } from "@/lib/imageValidation";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GETIMG_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Missing GETIMG_API_KEY on server" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { absType, intensity, image, mask, seed, width, height } = body;

        if (!absType || !image || !mask) {
            return NextResponse.json(
                { error: "Missing required fields: absType, image, mask" },
                { status: 400 }
            );
        }

        // Resolve prompt and params server-side
        const prompt = getPromptForAbsType(absType);
        const negativePrompt = getNegativePrompt(absType);
        const params = getGenerationParams(absType, intensity);

        const validatedImage = validateImageDataUrl(image, "image");
        const validatedMask = validateImageDataUrl(mask, "mask");

        const cleanImage = validatedImage.base64;
        const cleanMask = validatedMask.base64;

        // GetImg.ai API endpoint for SDXL Inpainting
        // Note: flux-pro/inpaint doesn't exist in their API
        const endpoint = "https://api.getimg.ai/v1/stable-diffusion-xl/inpaint";

        console.log("Calling getimg.ai SDXL Inpainting:", endpoint);

        // Ensure dimensions are multiples of 64 if provided
        const safeWidth = width ? Math.floor(width / 64) * 64 : undefined;
        const safeHeight = height ? Math.floor(height / 64) * 64 : undefined;

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                prompt,
                negative_prompt: negativePrompt || undefined,
                image: cleanImage,
                mask_image: cleanMask,
                strength: params.strength || 0.75,
                steps: params.num_inference_steps || 25,
                guidance: params.guidance_scale || 7.5,
                seed: seed,
                width: safeWidth,
                height: safeHeight,
                output_format: "jpeg",
                response_format: "b64",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("getimg.ai error:", response.status, errorText);
            throw new Error(`getimg.ai failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (data.image) {
            return NextResponse.json({
                image: `data:image/jpeg;base64,${data.image}`,
                model_used: "GetImg.ai SDXL"
            });
        } else {
            throw new Error("No image in response");
        }

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("API route error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
