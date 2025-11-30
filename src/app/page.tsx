import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-brand-darkest text-brand-lightest relative">
            {/* Animated blue vignette border - updated to match dark theme */}
            <div className="fixed inset-0 pointer-events-none z-10 shadow-[inset_0_0_80px_rgba(37,55,69,0.6)] md:shadow-[inset_0_0_120px_rgba(37,55,69,0.5)] animate-pulse" />

            {/* Header */}
            <header className="border-b border-brand-medium bg-brand-darkest/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                        <span className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif' }}>ABS.AI</span>
                    </Link>
                    <Link href="/editor">
                        <button className="px-6 py-2 bg-brand-medium text-white rounded-full font-semibold hover:bg-brand-light transition-colors border border-brand-light/30">
                            Try Now
                        </button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-20 pb-32 px-6 text-center bg-gradient-to-b from-brand-dark to-brand-darkest">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                        Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lighter to-white">6-Pack Abs</span> in Seconds with AI
                    </h1>
                    <p className="text-xl text-brand-lighter mb-10 max-w-2xl mx-auto">
                        Transform your photos instantly. Natural, realistic results tailored to your body type. No gym required (yet).
                    </p>
                    <Link href="/editor">
                        <button className="px-10 py-5 bg-brand-medium text-white text-xl rounded-full font-bold hover:bg-brand-light transition-colors shadow-xl border border-brand-light/50">
                            Start Transformation
                        </button>
                    </Link>
                    <p className="mt-4 text-sm text-brand-light">No subscription. Instant results.</p>
                </div>
            </section>

            {/* Demo/Examples Section */}
            <section className="py-20 bg-brand-darkest">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16 text-white">Real Results</h2>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <div className="bg-brand-dark rounded-2xl overflow-hidden aspect-[3/4] relative group border border-brand-medium">
                                <Image
                                    src="/before.webp"
                                    alt="Before transformation"
                                    fill
                                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">Before</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-brand-dark rounded-2xl overflow-hidden aspect-[3/4] relative group shadow-2xl ring-4 ring-brand-medium/50">
                                <Image
                                    src="/after.webp"
                                    alt="After transformation"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute top-4 left-4 bg-brand-medium text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-brand-light/30">After (Natural Fit)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-20 bg-brand-dark">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16 text-white">How It Works</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: "📸", title: "1. Upload Photo", desc: "Choose a photo with good lighting showing your torso." },
                            { icon: "🖌️", title: "2. Paint Mask", desc: "Highlight the area where you want your abs to appear." },
                            { icon: "✨", title: "3. Get Results", desc: "AI generates realistic abs in seconds. Download or retry." }
                        ].map((step, i) => (
                            <div key={i} className="bg-brand-darkest p-8 rounded-2xl shadow-lg border border-brand-medium text-center hover:border-brand-light transition-colors">
                                <div className="text-4xl mb-6">{step.icon}</div>
                                <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                                <p className="text-brand-lighter">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-brand-medium bg-brand-darkest text-center text-brand-light text-sm">
                © {new Date().getFullYear()} ABS.AI. All rights reserved.
            </footer>
        </div>
    );
}
