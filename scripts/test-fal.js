const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Load Environment Variables
const envPath = path.join(process.cwd(), '.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/FAL_AI_API_KEY=["']?([^"'\n]+)["']?/);
    if (match) {
        apiKey = match[1];
    }
} catch (e) {
    console.error("Error reading .env.local:", e.message);
    process.exit(1);
}

if (!apiKey) {
    console.error("FAL_AI_API_KEY not found in .env.local");
    process.exit(1);
}

console.log("Found API Key:", apiKey.substring(0, 10) + "...");

// 2. Prepare Test Data (512x512 black image Base64)
const imageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAQElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/Bw8XAAB6wJ4awAAAABJRU5ErkJggg==";
const maskBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAQElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/Bw8XAAB6wJ4awAAAABJRU5ErkJggg==";

const requestBody = JSON.stringify({
    image_url: imageBase64,
    mask_url: maskBase64,
    prompt: "a red box",
    num_inference_steps: 28,
    guidance_scale: 2.5,
    strength: 0.4,
    enable_safety_checker: true
});

// 3. Make Request
const options = {
    hostname: 'fal.run',
    path: '/fal-ai/flux-general/inpainting',
    method: 'POST',
    headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': requestBody.length
    }
};

console.log("Sending request to Fal.ai...");

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log("Response Body:");
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));

            if (json.images && json.images[0]) {
                console.log("\nSUCCESS: Image URL received:", json.images[0].url);
            } else if (json.image && json.image.url) {
                console.log("\nSUCCESS: Image URL received:", json.image.url);
            } else {
                console.log("\nFAILURE: No image URL in response.");
            }
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error("Request Error:", error);
});

req.write(requestBody);
req.end();
