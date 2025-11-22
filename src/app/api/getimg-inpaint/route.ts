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
        const { prompt, image, mask, strength, negative_prompt, seed } = body;

        if (!prompt || !image || !mask) {
            return NextResponse.json(
                { error: "Missing required fields: prompt, image, mask" },
                { status: 400 }
            );
        }

        // Clean base64 strings (remove data:image/png;base64, prefix if present)
        const cleanImage = image.replace(/^data:image\/\w+;base64,/, "");
        const cleanMask = mask.replace(/^data:image\/\w+;base64,/, "");

        // Endpoint for Flux Schnell Inpainting (assuming standard naming convention)
        // If this 404s, we might need to check docs again or fallback to SDXL
        // Based on getimg.ai patterns: v1/flux-schnell/inpaint
        const endpoint = "https://api.getimg.ai/v1/flux-schnell/inpaint";

        console.log("Calling getimg.ai Flux Inpainting:", endpoint);

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
                mask_image: cleanMask, // getimg usually expects 'mask_image' not 'mask'
                strength: strength || 0.8, // Flux inpainting strength might work differently, usually 0.0 to 1.0
                steps: 4, // Schnell is fast, 4-8 steps usually enough
                guidance: 3.5,
                seed: seed,
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
                image: `data:image/png;base64,${data.image}`,
                model_used: "getimg.ai Flux Schnell"
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
