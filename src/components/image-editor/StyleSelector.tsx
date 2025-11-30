import React from "react";

// Transformation categories
export const TRANSFORMATION_CATEGORIES = {
    abs: [
        { id: 'natural_fit', label: 'Natural Fit', description: 'Subtle, natural definition' },
        { id: 'athletic', label: 'Athletic', description: 'Moderate muscle tone' },
        { id: 'defined', label: 'Defined', description: 'Clear six-pack visible' },
    ],
    weightLoss: [
        { id: 'weight_loss_5', label: '-5 kg (Beta)', description: 'Toned, slimmer look' },
        { id: 'weight_loss_10', label: '-10 kg (Beta)', description: 'Significant change' },
        { id: 'ozempic', label: 'Ozempic Effect (Beta)', description: 'Rapid weight loss look' },
    ],
    training: [
        { id: 'six_months_running', label: '6 Months Running', description: 'Endurance athlete vibe' },
        { id: 'six_months_climbing', label: '6 Months Climbing', description: 'Functional climber muscle' },
        { id: 'six_months_gym', label: '6 Months Gym', description: 'Balanced hypertrophy look' },
    ]
};

const cardBase =
    "rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

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
    className = "",
}: {
    style: { id: string; label: string; description: string };
    selected: boolean;
    onSelect: () => void;
    className?: string;
}) => (
    <button
        onClick={onSelect}
        className={`${cardBase} ${selected ? "bg-white text-brand-dark shadow-lg" : "hover:bg-white/10 text-white"} ${className}`}
    >
        <div className="flex items-start justify-between gap-3">
            <div>
                <div className="text-base font-semibold">{style.label}</div>
                <p className={`mt-1 text-sm ${selected ? "text-brand-dark/70" : "text-white/60"}`}>
                    {style.description}
                </p>
            </div>
            {selected && <span className="text-sm font-semibold text-brand-dark">Selected</span>}
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
                <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory">
                    {TRANSFORMATION_CATEGORIES.weightLoss.map((style) => (
                        <TransformationCard
                            key={style.id}
                            style={style}
                            selected={selectedType === style.id}
                            onSelect={() => onSelect(style.id)}
                            className="min-w-[220px] snap-start"
                        />
                    ))}
                </div>
            </section>

            <section>
                <CategoryHeader title="Training Journeys" subtitle="6 month programs" />
                <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory">
                    {TRANSFORMATION_CATEGORIES.training.map((style) => (
                        <TransformationCard
                            key={style.id}
                            style={style}
                            selected={selectedType === style.id}
                            onSelect={() => onSelect(style.id)}
                            className="min-w-[220px] snap-start"
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
