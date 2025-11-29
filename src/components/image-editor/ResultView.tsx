import React from "react";
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
    const styles = [
        { id: 'natural_fit', label: 'Natural Fit' },
        { id: 'athletic', label: 'Athletic' },
        { id: 'defined', label: 'Defined' },
    ];

    return (
        <div className="text-center">
            <h3 className="text-2xl font-bold mb-6">Your Enhanced Photo</h3>

            <div className="mb-6">
                <Image src={resultUrl} alt="Result" className="mx-auto rounded-lg shadow-lg max-w-full" width={600} height={600} />
            </div>

            {/* Rating */}
            {!feedbackGiven ? (
                <div className="mb-8">
                    <p className="mb-4 font-semibold">How do you like the result?</p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => onRate(1)}
                            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                        >
                            Love it!
                        </button>
                        <button
                            onClick={() => onRate(-1)}
                            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                        >
                            Not satisfied
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`mb-8 p-4 rounded-lg transition-all duration-500 ${userRating === 1 ? 'bg-green-50 text-green-800 border-2 border-green-200' : 'bg-orange-50 text-orange-800 border-2 border-orange-200'}`}>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl">{userRating === 1 ? '✓' : '💪'}</span>
                        <span className="font-semibold">
                            {userRating === 1
                                ? 'Thank you! Your feedback helps us improve.'
                                : 'Not happy with AI results? Try the gym for 6 months! 🏋️ In half a year, AI will be perfect AND you\'ll have real abs. Win-win! 😉'}
                        </span>
                    </div>
                </div>
            )}

            {/* Social Share */}
            <div className="mb-8">
                <p className="text-sm text-gray-500 mb-3 uppercase tracking-wide font-semibold">Share your transformation</p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Check out my transformation with ABS.AI! 💪')}`, '_blank')}
                        className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"
                        title="Share on Telegram"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0 .056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                    </button>
                    <button
                        onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Check out my transformation with ABS.AI! 💪')}`, '_blank')}
                        className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
                        title="Share on X (Twitter)"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </button>
                    <button
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Check out my transformation with ABS.AI! 💪 ' + window.location.href)}`, '_blank')}
                        className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
                        title="Share on WhatsApp"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                    </button>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied!');
                        }}
                        className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors"
                        title="Copy Link"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                </div>
            </div>

            {/* Try Other Styles */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <p className="mb-4 font-semibold text-gray-700">Try a different style?</p>
                <div className="flex flex-wrap justify-center gap-3">
                    {styles.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onRegenerate(style.id)}
                            disabled={currentStyle === style.id}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStyle === style.id
                                ? 'bg-gray-200 text-gray-400 cursor-default'
                                : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 shadow-sm'
                                }`}
                        >
                            {style.label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={onReset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
                Start Over
            </button>
        </div>
    );
}
