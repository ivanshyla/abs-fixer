import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black text-white font-sans selection:bg-white selection:text-black">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/statue-bg.png"
                    alt="Statue Background"
                    fill
                    className="object-cover object-center grayscale contrast-125"
                    priority
                />
                {/* Subtle overlay to ensure text readability if needed, but keeping it minimal for brutalist look */}
                <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Header / Logo */}
            <header className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center">
                <Link href="/" className="group">
                    <span className="text-sm font-bold tracking-[0.2em] uppercase opacity-70 group-hover:opacity-100 transition-opacity">
                        ABS.AI
                    </span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
                {/* Massive Title */}
                <h1 className="text-[5rem] md:text-[9rem] leading-none font-black tracking-tighter mb-12 uppercase mix-blend-overlay opacity-90">
                    ABS.AI
                </h1>

                {/* Buttons Container */}
                <div className="flex flex-col gap-4 w-full max-w-xs md:max-w-sm">
                    <Link href="/editor" className="w-full">
                        <button className="w-full bg-white text-black font-bold py-4 px-8 rounded-full text-sm md:text-base hover:scale-105 transition-transform duration-200 uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            MAKE A GOOD ABS
                        </button>
                    </Link>

                    {/* Secondary Button (Optional, linking to same editor for now or scroll) */}
                    <Link href="/editor" className="w-full">
                        <button className="w-full bg-white text-black font-bold py-4 px-8 rounded-full text-sm md:text-base hover:scale-105 transition-transform duration-200 uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            WRITE A PROMPT
                        </button>
                    </Link>
                </div>

                {/* Footer Text */}
                <p className="mt-12 text-xs md:text-sm font-medium tracking-[0.3em] uppercase opacity-60">
                    No gym required (yet)
                </p>
            </main>

            {/* Minimal Footer */}
            <footer className="absolute bottom-6 w-full text-center z-10">
                <p className="text-[10px] uppercase tracking-widest opacity-30">
                    © {new Date().getFullYear()} ABS Fixer
                </p>
            </footer>
        </div>
    );
}
