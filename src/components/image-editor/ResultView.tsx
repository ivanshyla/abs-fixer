import React, { useState } from "react";
import Image from "next/image";

interface ResultViewProps {
    resultUrl: string;
    userRating: number | null;
    feedbackGiven: boolean;
    onRate: (rating: -1 | 1) => void;
    onReset: () => void;
    onRegenerate: (style: string) => void;
    currentStyle: string;
    generationId?: string; // NEW: for feedback tracking
}

export default function ResultView({
    resultUrl,
    userRating,
    feedbackGiven,
    onRate,
    onReset,
    onRegenerate,
    currentStyle,
}: ResultViewProps) {
    const [localFeedbackGiven, setLocalFeedbackGiven] = useState(false);
    const [localRating, setLocalRating] = useState<number | null>(null);

    const handleRate = (rating: -1 | 1) => {
        setLocalFeedbackGiven(true);
        setLocalRating(rating);
        onRate(rating);
    };

    const isFeedbackGiven = feedbackGiven || localFeedbackGiven;
    const currentRating = userRating || localRating;

    const handleShare = async () => {
        // Try to share the actual image file if supported (mostly mobile)
        if (navigator.share) {
            try {
                const response = await fetch(resultUrl);
                const blob = await response.blob();
                const file = new File([blob], 'abs-transformation.png', { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'My ABS.AI Transformation',
                        text: 'Check out my new abs generated with AI! 💪',
                        files: [file],
                        url: 'https://absai.app'
                    });
                    return;
                }
            } catch (e) {
                console.log('Native sharing failed, falling back to links', e);
            }
        }

        // Fallback to copying link
        navigator.clipboard.writeText('https://absai.app');
        alert('Link copied to clipboard! Share it with your friends.');
    };

    return (
        <div className="text-center">
            <h3 className="text-2xl font-bold mb-6 text-white">Your Enhanced Photo</h3>

            <div className="mb-6 relative group">
                <Image src={resultUrl} alt="Result" className="mx-auto rounded-lg shadow-2xl max-w-full border-2 border-brand-medium" width={600} height={600} />
            </div>

            {/* Rating */}
            {!isFeedbackGiven ? (
                <div className="mb-8">
                    <p className="mb-4 font-semibold text-brand-lighter">How do you like the result?</p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => handleRate(1)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg shadow-green-900/20"
                        >
                            Love it!
                        </button>
                        <button
                            onClick={() => handleRate(-1)}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg shadow-red-900/20"
                        >
                            Not satisfied
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`mb-8 p-4 rounded-lg transition-all duration-500 border ${currentRating === 1
                    ? 'bg-green-900/20 text-green-300 border-green-800'
                    : 'bg-orange-900/20 text-orange-300 border-orange-800'}`}>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl">{currentRating === 1 ? '✓' : '💪'}</span>
                        <span className="font-semibold">
                            {currentRating === 1
                                ? 'Thank you! Your feedback helps us improve.'
                                : 'Not happy? Try the gym for 6 months! 🏋️ In half a year, AI will be perfect AND you\'ll have real abs. Win-win! 😉'}
                        </span>
                    </div>
                </div>
            )}

            {/* Social Share */}
            <div className="mb-8">
                <p className="text-sm text-brand-light mb-3 uppercase tracking-wide font-semibold">Share your transformation</p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-medium text-white rounded-full hover:bg-brand-light transition-colors font-semibold shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                        Share Result
                    </button>
                </div>
            </div>

            {/* Try Other Styles */}
            <div className="mb-8 p-6 bg-brand-medium/20 rounded-xl border border-brand-medium/50">
                <p className="mb-4 font-semibold text-brand-light">Try a different style?</p>
                <div className="flex flex-wrap justify-center gap-3">
                    {[
                        { id: 'natural_fit', label: 'Natural Fit' },
                        { id: 'athletic', label: 'Athletic' },
                        { id: 'defined', label: 'Defined' },
                        { id: 'weight_loss_5', label: '-5 kg' },
                        { id: 'weight_loss_10', label: '-10 kg' },
                        { id: 'ozempic', label: 'Ozempic' },
                    ].map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onRegenerate(style.id)}
                            disabled={currentStyle === style.id}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStyle === style.id
                                ? 'bg-brand-medium text-brand-light cursor-default'
                                : 'bg-brand-dark border border-brand-light text-brand-lighter hover:border-white hover:text-white shadow-sm'
                                }`}
                        >
                            {style.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <button
                    onClick={onReset}
                    className="px-6 py-2 text-brand-lighter hover:text-white underline transition-colors"
                >
                    Start Over
                </button>
                <a
                    href={resultUrl}
                    download="abs-fixer-result.png"
                    className="px-6 py-2 bg-brand-darkest border border-brand-light text-white rounded-lg hover:bg-brand-dark transition-colors"
                >
                    Download Image
                </a>
            </div>
        </div >
    );
}
