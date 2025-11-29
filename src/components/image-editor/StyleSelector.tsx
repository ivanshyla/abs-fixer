import React from "react";

// Transformation categories
export const TRANSFORMATION_CATEGORIES = {
    abs: [
        { id: 'natural_fit', label: 'Natural Fit', description: 'Subtle, natural definition' },
        { id: 'athletic', label: 'Athletic', description: 'Moderate muscle tone' },
        { id: 'defined', label: 'Defined', description: 'Clear six-pack visible' },
    ],
    weightLoss: [
        { id: 'weight_loss_5', label: '-5 kg', description: 'Toned, slimmer look' },
        { id: 'weight_loss_10', label: '-10 kg', description: 'Significant change' },
        { id: 'ozempic', label: 'Ozempic Effect', description: 'Rapid weight loss look' },
    ]
};

interface StyleSelectorProps {
    selectedType: string;
    onSelect: (type: string) => void;
}

export default function StyleSelector({ selectedType, onSelect }: StyleSelectorProps) {
    return (
        <div className="mb-6 space-y-6">
            {/* Abs Section */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">💪</span> Abs Enhancement
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {TRANSFORMATION_CATEGORIES.abs.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onSelect(style.id)}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${selectedType === style.id
                                ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex-1">
                                <div className={`font-semibold ${selectedType === style.id ? 'text-blue-800' : 'text-gray-800'}`}>
                                    {style.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {style.description}
                                </div>
                            </div>
                            {selectedType === style.id && (
                                <div className="text-blue-600 font-bold text-sm">✓</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weight Loss Section */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">⚖️</span> Weight Loss
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {TRANSFORMATION_CATEGORIES.weightLoss.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onSelect(style.id)}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${selectedType === style.id
                                ? 'bg-purple-50 border-purple-600 ring-1 ring-purple-600'
                                : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex-1">
                                <div className={`font-semibold ${selectedType === style.id ? 'text-purple-800' : 'text-gray-800'}`}>
                                    {style.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {style.description}
                                </div>
                            </div>
                            {selectedType === style.id && (
                                <div className="text-purple-600 font-bold text-sm">✓</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
