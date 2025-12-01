import React from "react";

// Transformation categories
export const TRANSFORMATION_CATEGORIES = {
    abs: [
        { id: 'natural_fit', label: 'Natural Fit', description: 'Subtle, natural definition' },
        { id: 'athletic', label: 'Athletic', description: 'Moderate muscle tone' },
        { id: 'defined', label: 'Defined', description: 'Clear six-pack visible' },
    ]
};

const cardBase =
    "rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

interface StyleSelectorProps {
    selectedType: string;
    onSelect: (type: string) => void;
}

const CategoryHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-2">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">{subtitle}</p>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
);

const TransformationCard = ({
    style,
    selected,
    onSelect,
}: {
    style: { id: string; label: string; description: string };
    selected: boolean;
    onSelect: () => void;
}) => (
    <button
        onClick={onSelect}
        className={`${cardBase} ${selected
            ? "bg-white/15 border-white/60 text-white shadow-lg"
            : "bg-white/5 border-white/10 text-white/90 hover:bg-white/10"}`}
    >
        <div className="flex items-start justify-between gap-3">
            <div>
                <div className={`text-base font-semibold ${selected ? "text-white" : "text-white"}`}>
                    <span>{style.label}</span>
                    {style.badge && (
                        <span className={`ml-2 text-xs font-semibold tracking-wide uppercase rounded-full px-2 py-0.5 ${selected ? "bg-white text-brand-darkest" : "bg-white/15 text-white/80"}`}>
                            {style.badge}
                        </span>
                    )}
                </div>
                <p className={`mt-1 text-sm ${selected ? "text-white/80" : "text-white/70"}`}>
                    {style.description}
                </p>
            </div>
            {selected && <span className="text-sm font-semibold text-white/80">Selected</span>}
        </div>
    </button>
);

export default function StyleSelector({ selectedType, onSelect }: StyleSelectorProps) {
    return (
        <div className="mb-6 space-y-6">
            <section>
                <CategoryHeader title="Abs Enhancement" subtitle="Core definition" />
                <div className="grid grid-cols-1 gap-3">
                    {TRANSFORMATION_CATEGORIES.abs.map((style) => (
                        <TransformationCard
                            key={style.id}
                            style={style}
                            selected={selectedType === style.id}
                            onSelect={() => onSelect(style.id)}
                        />
                    ))}
                </div>
            </section>

            <section>
                <CategoryHeader title="Weight Loss" subtitle="Sculpt & slim" />
            <section>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    More transformation modes coming soon.
                </div>
            </section>
        </div>
    );
}
