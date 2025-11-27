import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

// Initialize Google Auth with explicit credentials
const getGoogleAuth = () => {
    const credentialsJson = process.env.GOOGLE_CREDENTIALS;
    if (credentialsJson) {
        try {
            const credentials = JSON.parse(credentialsJson);
            // Use fromJSON for better compatibility with Amplify
            return new GoogleAuth({
                credentials,
                scopes: ["https://www.googleapis.com/auth/cloud-platform"],
                projectId: credentials.project_id,
            });
        } catch (e) {
            console.error("Failed to parse GOOGLE_CREDENTIALS:", e);
            throw new Error("Invalid Google credentials configuration");
        }
    }
    throw new Error("GOOGLE_CREDENTIALS environment variable not set");
};

let auth: GoogleAuth;
try {
    auth = getGoogleAuth();
} catch (e) {
    console.error("Google Auth initialization failed:", e);
    // Create a dummy auth that will fail gracefully
    auth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
}

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

        // Get Project ID and Location from env
        const projectId = process.env.GOOGLE_PROJECT_ID || 'tailwind-452000';
        const location = process.env.GOOGLE_LOCATION || "us-central1";

        if (!projectId) {
            console.error("Missing GOOGLE_PROJECT_ID");
            return NextResponse.json(
                { error: "Server configuration error: Missing Google Project ID" },
                { status: 500 }
            );
        }

        // Get Access Token
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        if (!accessToken.token) {
            throw new Error("Failed to generate Google Access Token");
        }

        // Helper to extract Base64
        const extractBase64 = (dataUrl: string) => {
            const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                throw new Error("Invalid Data URL format");
            }
            return matches[2];
        };

        const imageBase64 = extractBase64(image);
        const maskBase64 = extractBase64(mask);

        // Vertex AI API Endpoint for Imagen
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`;

        console.log(`Calling Vertex AI: ${endpoint}`);

        const requestBody = {
            instances: [
                {
                    prompt: prompt,
                    image: {
                        bytesBase64Encoded: imageBase64
                    },
                    mask: {
                        image: {
                            bytesBase64Encoded: maskBase64
                        }
                    }
                },
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1",
                negativePrompt: "blurry, low quality, distorted, unrealistic, cartoon, anime, fake",
                guidanceScale: 15,
                seed: seed || Math.floor(Math.random() * 1000000),
                // Add safety settings to allow fitness/body photos
                safetyFilterLevel: "BLOCK_ONLY_HIGH",
                personGeneration: "ALLOW_ADULT",
            },
        };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Vertex AI Error:", errorText);
            throw new Error(`Vertex AI API failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        // Parse prediction
        if (!data.predictions || data.predictions.length === 0) {
            throw new Error("No predictions returned from Vertex AI");
        }

        const outputBase64 = data.predictions[0].bytesBase64Encoded;
        const outputMimeType = data.predictions[0].mimeType || "image/png";
        const outputImageUrl = `data:${outputMimeType};base64,${outputBase64}`;

        return NextResponse.json({
            image: outputImageUrl,
            model_used: "Google Vertex AI (Imagen)",
            seed: seed
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Vertex AI Route Error:", message);

        // Check if it's a safety filter error
        if (message.includes("safety filter") || message.includes("blocked") || message.includes("INVALID_ARGUMENT")) {
            return NextResponse.json({
                error: "Google AI mistakenly flagged this fitness photo as sensitive content. This is a false positive - your photo is perfectly appropriate for body transformation. Please try switching to Fal.ai or GetImg provider, which handle fitness photos better.",
                errorType: "SAFETY_FILTER"
            }, { status: 400 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
```
