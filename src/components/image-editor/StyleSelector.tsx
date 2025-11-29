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
                <h3 className="text-sm font-bold text-brand-lighter mb-3 flex items-center gap-2">
                    <span className="text-xl">💪</span> Abs Enhancement
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {TRANSFORMATION_CATEGORIES.abs.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onSelect(style.id)}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${selectedType === style.id
                                ? 'bg-brand-medium border-brand-lighter ring-1 ring-brand-lighter'
                                : 'bg-brand-dark border-brand-medium hover:border-brand-light hover:bg-brand-medium/50'
                                }`}
                        >
                            <div className="flex-1">
                                <div className={`font-semibold ${selectedType === style.id ? 'text-white' : 'text-brand-lighter'}`}>
                                    {style.label}
                                </div>
                                <div className="text-xs text-brand-light">
                                    {style.description}
                                </div>
                            </div>
                            {selectedType === style.id && (
                                <div className="text-brand-lighter font-bold text-sm">✓</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weight Loss Section */}
            <div>
                <h3 className="text-sm font-bold text-brand-lighter mb-3 flex items-center gap-2">
                    <span className="text-xl">⚖️</span> Weight Loss
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {TRANSFORMATION_CATEGORIES.weightLoss.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onSelect(style.id)}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${selectedType === style.id
                                ? 'bg-brand-medium border-brand-lighter ring-1 ring-brand-lighter'
                                : 'bg-brand-dark border-brand-medium hover:border-brand-light hover:bg-brand-medium/50'
                                }`}
                        >
                            <div className="flex-1">
                                <div className={`font-semibold ${selectedType === style.id ? 'text-white' : 'text-brand-lighter'}`}>
                                    {style.label}
                                </div>
                                <div className="text-xs text-brand-light">
                                    {style.description}
                                </div>
                            </div>
                            {selectedType === style.id && (
                                <div className="text-brand-lighter font-bold text-sm">✓</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
