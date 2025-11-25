import { NextRequest, NextResponse } from "next/server";

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
        const { prompt, image, mask, strength, negative_prompt, seed, width, height } = body;

        if (!prompt || !image || !mask) {
            return NextResponse.json(
                { error: "Missing required fields: prompt, image, mask" },
                { status: 400 }
            );
        }

        // Clean base64 strings (remove data:image/png;base64, prefix if present)
        const cleanImage = image.replace(/^data:image\/\w+;base64,/, "");
        const cleanMask = mask.replace(/^data:image\/\w+;base64,/, "");

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
                image: cleanImage,
                mask_image: cleanMask,
                strength: strength || 0.75,
                steps: 25,
                guidance: 7.5,
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
