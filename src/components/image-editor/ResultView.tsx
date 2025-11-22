import React from "react";
import Image from "next/image";

interface ResultViewProps {
    resultUrl: string;
    userRating: number | null;
    onRate: (rating: -1 | 1) => void;
    onReset: () => void;
    onRegenerate: (style: string) => void;
    currentStyle: string;
}

export default function ResultView({
    resultUrl,
    userRating,
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
            {userRating === null ? (
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
                <div className={`mb-8 p-4 rounded-lg transition-all duration-500 ${userRating === 1 ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                    {userRating === 1
                        ? 'Thank you! Your feedback helps us improve.'
                        : 'Sorry to hear that. Try a different style or adjust the mask.'}
                </div>
            )}

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
