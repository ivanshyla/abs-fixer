import React from "react";

// Abs type options
export const ABS_TYPES = [
    { id: 'natural_fit', label: 'Natural Fit', description: 'Subtle, natural definition' },
    { id: 'athletic', label: 'Athletic', description: 'Moderate muscle tone' },
    { id: 'defined', label: 'Defined', description: 'Clear six-pack visible' },
];

interface StyleSelectorProps {
    selectedType: string;
    onSelect: (type: string) => void;
}

export default function StyleSelector({ selectedType, onSelect }: StyleSelectorProps) {
    return (
        <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Choose your desired look</label>
            <div className="space-y-3">
                {ABS_TYPES.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => onSelect(style.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${selectedType === style.id
                            ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                    >
                        <div>
                            <div className={`font-semibold ${selectedType === style.id ? 'text-blue-800' : 'text-gray-800'}`}>
                                {style.label}
                            </div>
                            <div className="text-xs text-gray-500">
                                {style.description}
                            </div>
                        </div>
                        {selectedType === style.id && (
                            <div className="ml-auto text-blue-600 font-bold text-sm">
                                SELECTED
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
