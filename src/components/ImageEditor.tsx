"use client";

import React, { useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import dynamic from "next/dynamic";

// Import sub-components
import UploadStep from "./image-editor/UploadStep";
import StyleSelector from "./image-editor/StyleSelector";
import PaymentForm from "./image-editor/PaymentForm";
import ResultView from "./image-editor/ResultView";

// Dynamic import for CanvasEditor to avoid SSR issues with Konva
const CanvasEditor = dynamic(() => import("./image-editor/CanvasEditor"), {
  ssr: false,
});

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

type Step = 'upload' | 'draw' | 'pay' | 'result';

export default function ImageEditor() {
  const [step, setStep] = useState<Step>('upload');
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User choices
  const [selectedAbsType, setSelectedAbsType] = useState<string>('natural_fit');
  const [userEmail, setUserEmail] = useState<string>('');

  // Payment
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Result
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);

  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null);

  // Handle file upload
  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new window.Image();
      img.onload = () => {
        setImageEl(img);
        setStep('draw');
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Payment flow
  const handleProceedToPayment = async () => {
    if (!userEmail) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          absType: selectedAbsType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setStep('pay');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Generate after payment
  const handleGenerateAfterPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get image and mask as data URLs
      const imageDataURL = imageEl?.src || '';
      const maskDataURL = maskCanvasRef.current?.toDataURL() || '';

      // Call generation API (Restored Fal.ai)
      const response = await fetch('/api/fal-inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: getPromptForAbsType(selectedAbsType),
          image: imageDataURL,
          mask: maskDataURL,
          strength: 0.4,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      // Save generation to database
      const saveResponse = await fetch('/api/save-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: null, // TODO: Add auth
          absType: selectedAbsType,
          outputImageUrl: data.image,
          modelUsed: data.model_used,
          promptUsed: getPromptForAbsType(selectedAbsType),
          strength: 0.25,
          seed: data.seed,
          paymentId: paymentIntentId,
        }),
      });

      const saveData = await saveResponse.json();

      if (saveResponse.ok) {
        setGenerationId(saveData.generation.id);
      }

      setResultUrl(data.image);
      setStep('result');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Rating
  const handleRating = async (rating: -1 | 1) => {
    if (!generationId) return;

    try {
      await fetch('/api/rate-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId,
          rating,
        }),
      });

      setUserRating(rating);
    } catch (err) {
      console.error('Rating failed:', err);
    }
  };

  const getPromptForAbsType = (absType: string) => {
    const prompts: Record<string, string> = {
      natural_fit: 'subtle natural abdominal definition, realistic athletic physique, minimal enhancement',
      athletic: 'moderate muscle tone, athletic six-pack abs, natural fitness level',
      defined: 'clear defined six-pack abs, strong muscle definition, fit physique',
    };
    return prompts[absType] || prompts.natural_fit;
  };

  // Dev bypass
  const handleDevGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get image and mask as data URLs
      const imageDataURL = imageEl?.src || '';
      const maskDataURL = maskCanvasRef.current?.toDataURL() || '';

      // Call generation API (Restored Fal.ai)
      const response = await fetch('/api/fal-inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: getPromptForAbsType(selectedAbsType),
          image: imageDataURL,
          mask: maskDataURL,
          strength: 0.4,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      // Save generation to database
      const saveResponse = await fetch('/api/save-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: null,
          absType: selectedAbsType,
          outputImageUrl: data.image,
          modelUsed: data.model_used,
          promptUsed: getPromptForAbsType(selectedAbsType),
          strength: 0.4,
          seed: data.seed,
          paymentId: 'dev_bypass',
        }),
      });

      const saveData = await saveResponse.json();

      if (saveResponse.ok) {
        setGenerationId(saveData.generation.id);
      }

      setResultUrl(data.image);
      setStep('result');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle regeneration with new style
  const handleRegenerate = async (style: string) => {
    setSelectedAbsType(style);
    // We need to use the new style immediately, not wait for state update
    // So we'll create a helper that accepts style override
    await generateImage(style);
  };

  // Provider selection
  const [useVertexAI, setUseVertexAI] = useState<boolean>(true);

  // Unified generation helper
  const generateImage = async (styleOverride?: string) => {
    setLoading(true);
    setError(null);

    const styleToUse = styleOverride || selectedAbsType;

    try {
      const imageDataURL = imageEl?.src || '';
      const maskDataURL = maskCanvasRef.current?.toDataURL() || '';

      // Choose API endpoint based on provider
      const apiEndpoint = useVertexAI ? '/api/vertex-inpaint' : '/api/fal-inpaint';
      console.log(`Generating with ${useVertexAI ? 'Vertex AI' : 'Fal.ai'}...`);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: getPromptForAbsType(styleToUse),
          image: imageDataURL,
          mask: maskDataURL,
          strength: 0.4,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      // Save generation
      const saveResponse = await fetch('/api/save-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: null,
          absType: styleToUse,
          outputImageUrl: data.image,
          modelUsed: data.model_used,
          promptUsed: getPromptForAbsType(styleToUse),
          strength: 0.4,
          seed: data.seed,
          paymentId: paymentIntentId || 'dev_bypass', // Use existing payment ID or dev
        }),
      });

      const saveData = await saveResponse.json();

      if (saveResponse.ok) {
        setGenerationId(saveData.generation.id);
      }

      setResultUrl(data.image);
      setStep('result');
      // Reset rating for new result
      setUserRating(null);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">ABS.ai - Body Enhancer</h1>

      {/* Progress Steps (Simple) */}
      <div className="flex justify-center gap-4 mb-8 text-sm text-gray-500">
        <span className={step === 'upload' ? 'font-bold text-blue-600' : ''}>1. Upload</span>
        <span>→</span>
        <span className={step === 'draw' ? 'font-bold text-blue-600' : ''}>2. Edit</span>
        <span>→</span>
        <span className={step === 'pay' ? 'font-bold text-blue-600' : ''}>3. Payment</span>
        <span>→</span>
        <span className={step === 'result' ? 'font-bold text-blue-600' : ''}>4. Result</span>
      </div>

      {step === 'upload' && (
        <UploadStep onImageSelect={handleImageSelect} />
      )}

      {step === 'draw' && imageEl && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <CanvasEditor
              imageEl={imageEl}
              maskCanvasRef={maskCanvasRef}
              onMaskChange={setMaskImage}
              maskImage={maskImage}
            />
          </div>
          <div>
            <StyleSelector
              selectedType={selectedAbsType}
              onSelect={setSelectedAbsType}
            />

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {error && (
                <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">{error}</div>
              )}

              <button
                onClick={handleProceedToPayment}
                disabled={loading || !maskImage || !userEmail}
                className={`w-full py-3 rounded-lg font-bold transition-all ${maskImage && userEmail
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {loading ? 'Processing...' : 'Proceed to Payment ($1.00)'}
              </button>

              {/* Step Hint */}
              {(!maskImage || !userEmail) && (
                <div className="mt-3 text-xs text-center text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">
                  {!maskImage ? 'Please paint over your abs first' : 'Please enter your email'}
                </div>
              )}

              {/* Dev Bypass Button */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-100 p-2 rounded">
                  <span>Provider: <b>{useVertexAI ? 'Google Vertex AI' : 'Fal.ai'}</b></span>
                  <button
                    onClick={() => setUseVertexAI(!useVertexAI)}
                    className="text-blue-600 hover:underline"
                  >
                    Switch
                  </button>
                </div>

                <button
                  onClick={() => generateImage()}
                  className="w-full py-2 bg-gray-800 text-white text-xs rounded hover:bg-gray-700"
                >
                  Test Generate (Free / Dev Mode)
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {step === 'pay' && clientSecret && (
        <div className="max-w-md mx-auto">
          {stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                onSuccess={() => generateImage()}
                onError={setError}
                loading={loading}
              />
            </Elements>
          ) : (
            <div className="text-red-500">Stripe configuration error</div>
          )}
          <button
            onClick={() => setStep('draw')}
            className="mt-4 text-gray-500 underline w-full text-center"
          >
            Back to Editor
          </button>
        </div>
      )}

      {step === 'result' && resultUrl && (
        <ResultView
          resultUrl={resultUrl}
          userRating={userRating}
          onRate={handleRating}
          onRegenerate={handleRegenerate}
          currentStyle={selectedAbsType}
          onReset={() => {
            setStep('upload');
            setImageEl(null);
            setResultUrl(null);
            setUserRating(null);
            setMaskImage(null);
            // Clear mask canvas
            if (maskCanvasRef.current) {
              const ctx = maskCanvasRef.current.getContext('2d');
              if (ctx) {
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
              }
            }
          }}
        />
      )}

      {loading && step !== 'pay' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-bold">Generating...</p>
          </div>
        </div>
      )}
    </div>
  );
}
