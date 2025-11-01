import { NextRequest } from "next/server";

// Function to convert data URL to base64
function dataURLToBase64(dataURL: string): string {
  return dataURL.split(',')[1];
}

// Simple deterministic seed from a string (keeps results stable per image/prompt)
function generateSeedFromString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  // Return a positive 53-bit-ish integer range
  return Math.abs(hash >>> 0);
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
    const seedToUse = body.seed ?? generateSeedFromString(`${imageB64?.slice(0, 128) || ''}::${prompt}`);
    
    // Build ultra-realistic prompt based on user's request
    const enhancedPrompt = `Create an ultra-realistic inpainted abdominal area that seamlessly matches the original photograph. ${prompt}

CRITICAL REQUIREMENTS:

1. PERFECT MATCHING
- Exact skin tone and undertone from original photo
- Same lighting direction, intensity, and quality
- Identical skin texture level as rest of body
- Consistent body hair density and distribution
- Preserve moles, freckles, scars near abs area
- Match natural body proportions
- Same photo quality and grain
- Completely invisible blending at edges

2. NATURAL MUSCLE DEFINITION
- Realistic asymmetry (real abs are never perfectly symmetrical)
- Natural muscle visibility appropriate for this person
- Visible rectus abdominis with natural separation
- Subtle oblique definition on sides
- Natural linea alba (center line)
- Skin follows muscle contours naturally
- NO artificial carved or photoshopped look

3. AUTHENTIC SKIN TEXTURE
- Visible pores matching natural skin texture
- Fine vellus hair and body hair matching surrounding area
- Natural imperfections: small bumps, irregularities
- Subtle skin tone variations
- Realistic details: moles, freckles if appropriate
- Visible hair follicles around navel
- Matte finish - NOT glossy or shiny

4. HUMAN IMPERFECTIONS
- Slight subcutaneous fat variations (normal on fit people)
- Faint veins under skin (subtle, not bodybuilder veins)
- Natural asymmetry in muscle size
- Slightly uneven skin texture
- Natural body hair distribution
- Realistic navel appearance

5. LIGHTING CONSISTENCY
- Match original light source direction
- Consistent shadow depth and softness
- Natural highlights on muscle peaks
- Subtle shadows between abs (not exaggerated)
- Same exposure and contrast as original

6. SEAMLESS INTEGRATION
- Perfect color matching at edges
- No visible borders or seams
- Consistent noise/grain with original
- Natural continuation of visible elements
- Match compression artifacts from original

The result must look like a real photograph of this person, not AI-generated or edited.`;

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
        negative_prompt: "perfect abs, magazine abs, superhuman muscles, bodybuilder physique, fake six pack, unrealistic muscle definition, photoshopped body, artificial enhancement, dramatic transformation, overly defined muscles, gym model physique, fitness magazine body, unnatural muscle separation, exaggerated abs, steroid body, professional athlete body, perfect symmetry, smooth skin, plastic skin, poreless skin, glossy skin, oiled skin, artificial lighting, painted shadows, CGI appearance, 3D render look, fitness model, commercial photography, airbrushed, retouched, artificial highlights, fake tan, perfect skin tone, unrealistic veins, carved appearance, sculpted look, magazine cover, professional bodybuilder, competition physique",
        num_inference_steps: 28,
        guidance_scale: 1.5,
        strength: Math.min(0.35, Math.max(0.18, strength || 0.25)),
        seed: seedToUse
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
    let imageUrl: string | undefined;
    const extractUrl = (payload: { images?: Array<{ url?: string } | string>; image_url?: string; image?: string }): string | undefined => {
      if (payload && payload.images && Array.isArray(payload.images) && payload.images.length > 0) {
        const firstImage = payload.images[0];
        if (typeof firstImage === 'string') return firstImage;
        if (typeof firstImage === 'object' && firstImage.url) return String(firstImage.url);
      }
      if (payload && payload.image_url) return String(payload.image_url);
      if (payload && payload.image) return String(payload.image);
      return undefined;
    };

    imageUrl = extractUrl(data);

    // If NSFW is flagged and we somehow got a censored/black output, try a one-time safer retry
    const nsfwFlagged = Array.isArray((data as { has_nsfw_concepts?: unknown[] })?.has_nsfw_concepts) && 
                       (data as { has_nsfw_concepts: unknown[] }).has_nsfw_concepts.length > 0;
    if (nsfwFlagged) {
      console.log("NSFW flagged by model. Retrying with safer constraints...");
      try {
        const saferResponse = await fetch("https://fal.run/fal-ai/flux-lora/inpainting", {
          method: "POST",
          headers: {
            "Authorization": `Key ${falApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageB64 ? `data:image/png;base64,${imageB64}` : `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAChAGAA==`,
            mask_url: mask ? `data:image/png;base64,${dataURLToBase64(mask)}` : `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP///8/AAMBAAACbwAAAAAElFTkSuQmCC`,
            prompt: `${enhancedPrompt}\n\nSFW, no nudity, no explicit content, keep chest fully covered outside mask, safe for work`,
            negative_prompt: "nudity, nipples, erotic, porn, explicit content, sexualized body, NSFW, indecent exposure, topless, bare chest, intimate areas, genitals, underwear",
            num_inference_steps: 28,
            guidance_scale: 1.5,
            strength: Math.min(0.32, Math.max(0.18, (strength || 0.25) * 0.9)),
            seed: seedToUse
          }),
        });
        
        if (saferResponse.ok) {
          const saferData = await saferResponse.json();
          console.log("Fal.ai safer retry response:", saferData);
          const saferUrl = extractUrl(saferData);
          if (saferUrl) imageUrl = saferUrl;
        } else {
          console.warn("Fal.ai safer retry failed with status:", saferResponse.status);
        }
      } catch (retryErr) {
        console.warn("Fal.ai safer retry error:", retryErr);
      }
    }

    if (!imageUrl) {
      console.error("Unexpected response:", data);
      throw new Error("No image found in response");
    }

    console.log("Generated image URL:", imageUrl);

    return new Response(
      JSON.stringify({
        success: true,
        image: imageUrl,
        model_used: "Fal.ai FLUX LoRA Inpainting",
        nsfw_flagged: !!nsfwFlagged,
        seed: seedToUse
      }),
      { status: 200 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fal.ai inpaint failed";
    console.error("/api/fal-inpaint error:", err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
