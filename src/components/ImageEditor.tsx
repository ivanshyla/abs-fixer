"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Image from "next/image";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Abs type options (simplified - no weight)
const ABS_TYPES = [
  { id: 'natural_fit', label: 'Natural Fit', description: 'Subtle, natural definition', icon: '💪' },
  { id: 'athletic', label: 'Athletic', description: 'Moderate muscle tone', icon: '🏃' },
  { id: 'defined', label: 'Defined', description: 'Clear six-pack visible', icon: '🔥' },
];

type Step = 'upload' | 'draw' | 'pay' | 'result';

export default function ImageEditor() {
  const [step, setStep] = useState<Step>('upload');
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [containerW, setContainerW] = useState(800);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [mode, setMode] = useState<"brush" | "erase">("brush");
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null);

  // Initialize mask canvas
  useEffect(() => {
    if (!maskCanvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      maskCanvasRef.current = canvas;
    }
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerW(containerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate scale
  useEffect(() => {
    if (imgSize.w && imgSize.h && containerW) {
      const targetWidth = Math.min(containerW * 0.9, 600);
      setScale(targetWidth / imgSize.w);
    }
  }, [imgSize, containerW]);

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new window.Image();
      img.onload = () => {
        setImageEl(img);
        setImgSize({ w: img.width, h: img.height });
        setStep('draw');
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Drawing logic
  const handlePointerDown = (e: unknown) => {
    if (step !== 'draw') return;
    setIsDrawing(true);
    const target = e as { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } };
    const stage = target.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const scaleX = imgSize.w / (imgSize.w * scale);
    const scaleY = imgSize.h / (imgSize.h * scale);
    const realX = pos.x * scaleX;
    const realY = pos.y * scaleY;

    drawOnMask(realX, realY);
  };

  const handlePointerMove = (e: unknown) => {
    if (!isDrawing || step !== 'draw') return;
    const target = e as { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } };
    const stage = target.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const scaleX = imgSize.w / (imgSize.w * scale);
    const scaleY = imgSize.h / (imgSize.h * scale);
    const realX = pos.x * scaleX;
    const realY = pos.y * scaleY;

    drawOnMask(realX, realY);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const drawOnMask = (x: number, y: number) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleFactor = 1024 / Math.max(imgSize.w, imgSize.h);
    const scaledX = x * scaleFactor;
    const scaledY = y * scaleFactor;
    const scaledBrushSize = brushSize * scaleFactor;

    ctx.globalCompositeOperation = mode === "brush" ? "source-over" : "destination-out";
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(scaledX, scaledY, scaledBrushSize / 2, 0, Math.PI * 2);
    ctx.fill();

    const maskImg = new window.Image();
    maskImg.onload = () => setMaskImage(maskImg);
    maskImg.src = canvas.toDataURL();
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setMaskImage(null);
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

      // Call generation API
      const response = await fetch('/api/fal-inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: getPromptForAbsType(selectedAbsType),
          image: imageDataURL,
          mask: maskDataURL,
          strength: 0.25,
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-2">Upload Your Photo</h3>
            <p className="text-gray-600">Choose a clear photo showing your torso</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            Choose Photo
          </button>
        </div>
      )}

      {/* Step: Draw Mask */}
      {step === 'draw' && imageEl && (
        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">Paint Your Abs Area</h3>
            <p className="text-gray-600">Use the brush to mark the area you want to enhance</p>
          </div>

          {/* Abs Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3">Choose Your Style</label>
            <div className="grid grid-cols-3 gap-4">
              {ABS_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedAbsType(type.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedAbsType === type.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="font-semibold">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div ref={containerRef} className="bg-gray-100 rounded-lg p-4 mb-4">
            <Stage
              ref={stageRef}
              width={imgSize.w * scale}
              height={imgSize.h * scale}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <Layer>
                <KonvaImage image={imageEl} scaleX={scale} scaleY={scale} />
                {maskImage && (
                  <KonvaImage
                    image={maskImage}
                    scaleX={scale}
                    scaleY={scale}
                    opacity={0.5}
                  />
                )}
              </Layer>
            </Stage>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setMode('brush')}
              className={`px-4 py-2 rounded ${mode === 'brush' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              ✏️ Brush
            </button>
            <button
              onClick={() => setMode('erase')}
              className={`px-4 py-2 rounded ${mode === 'erase' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              🧹 Eraser
            </button>
            <input
              type="range"
              min="20"
              max="80"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="flex-1"
            />
            <button onClick={clearMask} className="px-4 py-2 bg-red-500 text-white rounded">
              Clear
            </button>
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Email Address</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">We&apos;ll send your result here</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">{error}</div>
          )}

          {/* Proceed to Payment */}
          <button
            onClick={handleProceedToPayment}
            disabled={loading || !maskImage || !userEmail}
            className="w-full px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Proceed to Payment ($5.00)'}
          </button>
        </div>
      )}

      {/* Step: Payment */}
      {step === 'pay' && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            onSuccess={handleGenerateAfterPayment}
            onError={setError}
            loading={loading}
          />
        </Elements>
      )}

      {/* Step: Result */}
      {step === 'result' && resultUrl && (
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-6">Your Enhanced Photo</h3>

          <div className="mb-6">
            <Image src={resultUrl} alt="Result" className="mx-auto rounded-lg shadow-lg max-w-full" width={600} height={600} />
          </div>

          {/* Rating */}
          {userRating === null ? (
            <div className="mb-6">
              <p className="mb-4 font-semibold">How do you like the result?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleRating(1)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  👍 Love it!
                </button>
                <button
                  onClick={() => handleRating(-1)}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  👎 Not satisfied
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg">
              {userRating === 1 ? '✅ Thanks for your feedback!' : "📝 We'll work on improving!"}
            </div>
          )}

          <button
            onClick={() => {
              setStep('upload');
              setImageEl(null);
              setResultUrl(null);
              setUserRating(null);
              clearMask();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Another
          </button>
        </div>
      )}
    </div>
  );
}

// Payment Form Component
function PaymentForm({
  onSuccess,
  onError,
  loading,
}: {
  onSuccess: () => void;
  onError: (error: string) => void;
  loading: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Payment failed');
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Complete Payment</h3>
        <p className="text-gray-600">Secure payment via Stripe - $5.00</p>
      </div>

      <div className="mb-6">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || loading}
        className="w-full px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing || loading ? 'Processing...' : 'Pay & Generate ($5.00)'}
      </button>
    </form>
  );
}
