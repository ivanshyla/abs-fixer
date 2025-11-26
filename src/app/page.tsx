import Link from "next/link";
import Image from "next/image";
import ReferralSection from "@/components/ReferralSection";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white relative">
            {/* Blue Vignette Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[100] shadow-[inset_0_0_80px_rgba(59,130,246,0.4)] md:shadow-[inset_0_0_150px_rgba(59,130,246,0.3)] mix-blend-multiply" />

            {/* Header */}
            <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                        <span className="text-2xl font-semibold text-black tracking-tight" style={{ fontFamily: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif' }}>ABS.AI</span>
                    </Link>
                    <Link href="/editor">
                        <button className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors">
                            Try Now
                        </button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-20 pb-32 px-6 text-center bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">6-Pack Abs</span> in Seconds with AI
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Transform your photos instantly. Natural, realistic results tailored to your body type. No gym required (yet).
                    </p>
                    <Link href="/editor">
                        <button className="px-10 py-5 bg-blue-600 text-white text-xl rounded-full font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                            Start Transformation
                        </button>
                    </Link>
                    <p className="mt-4 text-sm text-gray-500">No subscription. Instant results.</p>
                </div>
            </section>

            {/* Demo/Examples Section */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16">Real Results</h2>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-[3/4] relative group">
                                <Image
                                    src="/before.jpg"
                                    alt="Before transformation"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">Before</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-[3/4] relative group shadow-2xl ring-4 ring-blue-100">
                                <Image
                                    src="/after.jpg"
                                    alt="After transformation"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">After (Natural Fit)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: "📸", title: "1. Upload Photo", desc: "Choose a photo with good lighting showing your torso." },
                            { icon: "🖌️", title: "2. Paint Mask", desc: "Highlight the area where you want your abs to appear." },
                            { icon: "✨", title: "3. Get Results", desc: "AI generates realistic abs in seconds. Download or retry." }
                        ].map((step, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                                <div className="text-4xl mb-6">{step.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-gray-600">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Referral Section */}
            <ReferralSection />

            {/* Footer */}
            <footer className="py-8 border-t border-gray-100 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} ABS.AI. All rights reserved. Tailwind inc.
            </footer>
        </div>
    );
}
