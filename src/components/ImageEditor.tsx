"use client";

import React, { useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import dynamic from "next/dynamic";
import { useCredits } from "@/hooks/useCredits";

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
  const [intensity, setIntensity] = useState<number>(50); // 0-100 slider
  const [provider] = useState<'fal' | 'vertex' | 'getimg'>('fal');
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Use new credit system
  const { credits, consumeCredit, hasCredits } = useCredits();

  // Load payment ID from local storage
  React.useEffect(() => {
    const savedPaymentId = localStorage.getItem('abs_payment_id');
    if (savedPaymentId) setPaymentIntentId(savedPaymentId);
  }, []);

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

  // Unified generation helper
  const generateImage = async (styleOverride?: string) => {
    setLoading(true);
    setError(null);

    const styleToUse = styleOverride || selectedAbsType;

    try {
      const imageDataURL = imageEl?.src || '';
      const maskDataURL = maskCanvasRef.current?.toDataURL() || '';

      // Get dimensions
      const width = imageEl?.naturalWidth;
      const height = imageEl?.naturalHeight;

      // Choose API endpoint based on provider
      const apiEndpoint =
        provider === 'vertex' ? '/api/vertex-inpaint' :
          provider === 'getimg' ? '/api/getimg-inpaint' :
            '/api/fal-inpaint';

      console.log(`Generating with ${provider}... Style: ${styleToUse}`);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          absType: styleToUse, // Send ID instead of prompt
          intensity,           // Send intensity for server to calculate strength
          image: imageDataURL,
          mask: maskDataURL,
          width,
          height,
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
          // promptUsed: ... // No longer available on client, server saves it
          // negativePrompt: ... // No longer available on client
          // strength: ... // No longer available on client
          intensity, // Save intensity instead
          seed: data.seed,
          paymentId: paymentIntentId || 'dev_bypass',
        }),
      });

      const saveData = await saveResponse.json();

      if (saveResponse.ok) {
        setGenerationId(saveData.generation.id);
      }

      setResultUrl(data.image);
      setStep('result');
      setUserRating(null);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Generate after payment (First time)
  const handleGenerateAfterPayment = async () => {
    if (paymentIntentId) localStorage.setItem('abs_payment_id', paymentIntentId);
    await generateImage();
    setShowSaveWarning(true);
  };

  // Wrapper to handle credit deduction
  const handleCreditGeneration = async () => {
    if (hasCredits()) {
      const success = await consumeCredit();
      if (success) {
        await generateImage();
        setShowSaveWarning(true);
      } else {
        setError("Credit limit reached. Please try again later.");
      }
    } else {
      handleProceedToPayment();
    }
  };

  // Handle regeneration with new style
  const handleRegenerate = async (style: string) => {
    setSelectedAbsType(style);
    if (hasCredits()) {
      const success = await consumeCredit();
      if (success) {
        await generateImage(style);
        setShowSaveWarning(true);
      } else {
        setError("Credit limit reached. Please try again later.");
      }
    } else {
      setError("No credits remaining. Please refresh to pay again.");
    }
  };

  // Rating
  const handleRating = async (rating: -1 | 1) => {
    if (!generationId) {
      console.warn('Cannot rate: Missing generationId');
      return;
    }

    try {
      const feedback = rating === 1 ? 'like' : 'dislike';

      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId,
          feedback,
        }),
      });

      setUserRating(rating);
      setFeedbackGiven(true);
    } catch (err) {
      console.error('Feedback submission failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">ABS.ai - Body Enhancer</h1>

      {/* Progress Steps (Simple) */}
      <div className="flex justify-center gap-4 mb-8 text-sm text-brand-light">
        <span className={step === 'upload' ? 'font-bold text-brand-lighter' : ''}>1. Upload</span>
        <span>→</span>
        <span className={step === 'draw' ? 'font-bold text-brand-lighter' : ''}>2. Edit</span>
        <span>→</span>
        <span className={step === 'pay' ? 'font-bold text-brand-lighter' : ''}>3. Payment</span>
        <span>→</span>
        <span className={step === 'result' ? 'font-bold text-brand-lighter' : ''}>4. Result</span>
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

            {/* Intensity Slider */}
            <div className="mt-6 p-4 bg-brand-dark rounded-lg border border-brand-medium">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-brand-lighter">Transformation Intensity</label>
                <span className="text-sm text-brand-light">{intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-2 bg-brand-medium rounded-lg appearance-none cursor-pointer accent-brand-lighter"
              />
              <div className="flex justify-between text-xs text-brand-light mt-1">
                <span>Subtle</span>
                <span>Balanced</span>
                <span>Strong</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-brand-dark rounded-lg border border-brand-medium">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-brand-lighter">Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-brand-medium rounded-lg bg-brand-darkest text-white placeholder-brand-light focus:border-brand-lighter focus:ring-1 focus:ring-brand-lighter outline-none"
                />
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-900/20 border-l-4 border-red-500 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold text-red-400 mb-1">Error</h3>
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {credits > 0 ? (
                <div className="mb-4">
                  <div className="text-sm font-bold text-green-400 mb-2">
                    Credits Remaining: {credits}
                  </div>
                  <button
                    onClick={handleCreditGeneration}
                    disabled={loading || !maskImage}
                    className="w-full py-3 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Generate Image (1 Credit)'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-brand-medium to-brand-dark border border-brand-light rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs font-semibold text-brand-lighter uppercase tracking-wide mb-1">Pay to Generate</div>
                        <div className="text-3xl font-bold text-white">$1.00</div>
                      </div>
                      <button
                        onClick={() => setShowPricingModal(true)}
                        className="w-8 h-8 rounded-full bg-brand-light text-white hover:bg-brand-lighter flex items-center justify-center font-bold shadow-md transition-all hover:scale-105"
                        title="Why $1? See breakdown"
                      >
                        ?
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-brand-lighter">
                        <span className="text-green-400 mr-2">✓</span>
                        <span><strong>6 credits</strong> = 6 AI generations</span>
                      </div>
                      <div className="flex items-center text-sm text-brand-lighter">
                        <span className="text-green-400 mr-2">✓</span>
                        <span>No subscription, no hidden fees</span>
                      </div>
                      <div className="flex items-center text-sm text-brand-lighter">
                        <span className="text-green-400 mr-2">✓</span>
                        <span>Try all 3 AI providers</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-brand-light">
                      <button
                        onClick={() => setShowPricingModal(true)}
                        className="text-xs text-brand-lighter hover:text-white font-medium underline"
                      >
                        See full cost breakdown →
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleProceedToPayment}
                    disabled={loading || !maskImage || !userEmail}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${maskImage && userEmail
                      ? 'bg-brand-lighter text-brand-darkest hover:bg-white shadow-md'
                      : 'bg-brand-medium text-brand-light cursor-not-allowed'
                      }`}
                  >
                    Proceed to Payment ($1.00)
                  </button>
                </div>
              )}

              {/* Step Hint */}
              {(!maskImage || !userEmail) && (
                <div className="mt-3 text-xs text-center text-orange-300 bg-orange-900/20 p-2 rounded border border-orange-800/50">
                  {!maskImage ? 'Please paint over your abs first' : 'Please enter your email'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'pay' && clientSecret && (
        <div className="max-w-md mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-red-400 mb-1">Payment error</h3>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}
          {stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#9BA8AB', colorBackground: '#11212D', colorText: '#CCD0CF' } } }}>
              <PaymentForm
                onSuccess={handleGenerateAfterPayment}
                onError={setError}
                loading={loading}
              />
            </Elements>
          ) : (
            <div className="text-red-500">Stripe configuration error</div>
          )}
          <button
            onClick={() => setStep('draw')}
            className="mt-4 text-brand-light hover:text-brand-lighter underline w-full text-center"
          >
            Back to Editor
          </button>
        </div>
      )}

      {step === 'result' && resultUrl && (
        <ResultView
          resultUrl={resultUrl}
          userRating={userRating}
          feedbackGiven={feedbackGiven}
          onRate={handleRating}
          onRegenerate={handleRegenerate}
          currentStyle={selectedAbsType}
          generationId={generationId || undefined}
          onReset={() => {
            setStep('upload');
            setImageEl(null);
            setResultUrl(null);
            setUserRating(null);
            setFeedbackGiven(false);
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

      {/* Save Warning Modal */}
      {showSaveWarning && resultUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-brand-dark p-8 rounded-2xl max-w-md mx-4 text-center shadow-2xl border border-brand-medium">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-4 text-white">Save Your Photo Now!</h3>
            <p className="text-brand-lighter mb-6">
              Your transformed photo will be lost if you close this page. Make sure to download it!
            </p>
            <div className="flex gap-4">
              <a
                href={resultUrl}
                download="abs-fixer-result.png"
                className="flex-1 px-6 py-3 bg-brand-medium text-white rounded-lg font-semibold hover:bg-brand-light transition border border-brand-light/30"
                onClick={() => setShowSaveWarning(false)}
              >
                Download Now
              </a>
              <button
                onClick={() => setShowSaveWarning(false)}
                className="flex-1 px-6 py-3 bg-brand-darkest text-brand-lighter rounded-lg font-semibold hover:bg-brand-dark transition border border-brand-medium"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Breakdown Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-brand-dark rounded-2xl max-w-lg w-full shadow-2xl border border-brand-medium">
            <div className="p-6 border-b border-brand-medium">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Why $1?</h3>
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="text-brand-light hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-brand-lighter mb-4">
                We believe in transparent pricing. Here&apos;s exactly where your dollar goes:
              </p>
              <div className="space-y-3 mb-6 text-brand-lightest">
                <div className="flex justify-between items-center">
                  <span className="text-brand-lighter">AI Generation Costs (6 images)</span>
                  <span className="font-semibold">$0.54</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-lighter">Payment Processing Fees</span>
                  <span className="font-semibold">$0.09</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-lighter">Server & Infrastructure</span>
                  <span className="font-semibold">$0.08</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-lighter">Advertising & Marketing</span>
                  <span className="font-semibold">$0.12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-lighter">Taxes</span>
                  <span className="font-semibold">$0.07</span>
                </div>
                <div className="border-t border-brand-medium pt-3 flex justify-between items-center">
                  <span className="text-brand-lighter font-semibold">Our Margin (10%)</span>
                  <span className="font-semibold text-green-400">$0.10</span>
                </div>
              </div>
              <div className="bg-brand-darkest rounded-lg p-4 text-sm text-brand-lighter border border-brand-medium">
                <p className="mb-2">
                  💡 <strong>Fun fact:</strong> Our Cursor AI subscription alone costs $200/month!
                </p>
                <p>
                  We keep our margins modest to make AI transformation accessible to everyone.
                </p>
              </div>
            </div>
            <div className="p-6 bg-brand-darkest rounded-b-2xl border-t border-brand-medium">
              <button
                onClick={() => setShowPricingModal(false)}
                className="w-full py-3 bg-brand-medium text-white rounded-lg font-semibold hover:bg-brand-light transition border border-brand-light/30"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && step !== 'pay' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-brand-dark p-8 rounded-lg text-center border border-brand-medium shadow-2xl">
            <div className="animate-spin w-12 h-12 border-4 border-brand-light border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-bold text-white">Generating...</p>
          </div>
        </div>
      )}
    </div>
  );
}
