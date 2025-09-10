import { NextRequest } from "next/server";

// Function to convert data URL to base64
function dataURLToBase64(dataURL: string): string {
  return dataURL.split(',')[1];
}

type FalInpaintRequest = {
  prompt: string;
  image?: string; // optional for now
  mask?: string;  // optional for now
  strength?: number;
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
};

export async function POST(req: NextRequest) {
  try {
    const falApiKey = process.env.FAL_AI_API_KEY;
    if (!falApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing FAL_AI_API_KEY on server" }),
        { status: 500 }
      );
    }

  const json = (await req.json()) as Partial<FalInpaintRequest>;
  const body: FalInpaintRequest = {
    prompt: String(json.prompt || ""),
    image: json.image ? String(json.image) : undefined,
    mask: json.mask ? String(json.mask) : undefined,
    strength: json.strength !== undefined ? Number(json.strength) : 0.1,
    negative_prompt: json.negative_prompt ? String(json.negative_prompt) : undefined,
    num_inference_steps: json.num_inference_steps !== undefined ? Number(json.num_inference_steps) : 25,
    guidance_scale: json.guidance_scale !== undefined ? Number(json.guidance_scale) : 3.5,
    seed: json.seed !== undefined ? Number(json.seed) : undefined,
  };

  const { prompt, image, mask, strength = 0.1 } = body;

  if (!prompt) {
    return new Response(
      JSON.stringify({ error: "Missing required field: prompt" }),
      { status: 400 }
    );
  }

  console.log("Fal.ai Realism Edit request:", { prompt, hasImage: !!image, strength });

    // Convert data URLs to base64 if provided
    const imageB64 = image ? dataURLToBase64(image) : null;
    
    // Ultra-subtle natural enhancement preserving individual body characteristics
    const enhancedPrompt = `${prompt}, slightly more toned midsection, preserve individual body type, keep natural body proportions, minimal muscle enhancement, realistic personal fitness level, maintain authentic skin and lighting, subtle improvement only, keep original body characteristics, natural athletic look for this person`;

    // Try Fal.ai flux-lora/inpainting endpoint for real inpainting!  
    console.log("Trying Fal.ai flux-lora/inpainting endpoint...");
    
    const response = await fetch("https://fal.run/fal-ai/flux-lora/inpainting", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageB64 ? `data:image/png;base64,${imageB64}` : `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAChAGAA==`,
        mask_url: mask ? `data:image/png;base64,${dataURLToBase64(mask)}` : `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP///8/AAMBAAACbwAAAAAElFTkSuQmCC`,
        prompt: enhancedPrompt,
        negative_prompt: "perfect abs, magazine abs, superhuman muscles, bodybuilder physique, fake six pack, unrealistic muscle definition, photoshopped body, artificial enhancement, dramatic transformation, overly defined muscles, gym model physique, fitness magazine body, unnatural muscle separation, exaggerated abs, steroid body, professional athlete body, perfect symmetry",
        num_inference_steps: 28,
        guidance_scale: 1.5,
        strength: Math.min(0.35, strength || 0.25)
      }),
    });
    
    console.log("Fal.ai response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Fal.ai error:", errorData);
      throw new Error(`Fal.ai failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    console.log("Fal.ai response:", data);

    // Simple direct response handling
    let imageUrl: string;
    if (data && data.images && Array.isArray(data.images) && data.images.length > 0) {
      imageUrl = String(data.images[0].url || data.images[0]);
    } else if (data && data.image_url) {
      imageUrl = String(data.image_url);
    } else if (data && data.image) {
      imageUrl = String(data.image);
    } else {
      console.error("Unexpected response:", data);
      throw new Error("No image found in response");
    }

    console.log("Generated image URL:", imageUrl);

    return new Response(
      JSON.stringify({
        success: true,
        image: imageUrl,
        model_used: "Fal.ai FLUX.1 [dev] Inpainting"
      }),
      { status: 200 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fal.ai inpaint failed";
    console.error("/api/fal-inpaint error:", err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
