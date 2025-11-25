import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                            <div className="text-white text-sm font-bold">AB</div>
                        </div>
                        <span className="text-xl font-bold text-gray-900">ABS Fixer</span>
                    </div>
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
                        Transform your photos instantly. Natural, realistic results tailored to your body type. No gym required.
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
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    [Before Image Placeholder]
                                </div>
                                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">Before</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-[3/4] relative group shadow-2xl ring-4 ring-blue-100">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    [After Image Placeholder]
                                </div>
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

            {/* CTA */}
            <section className="py-24 text-center">
                <h2 className="text-4xl font-bold mb-8">Ready to upgrade your look?</h2>
                <Link href="/editor">
                    <button className="px-10 py-5 bg-gray-900 text-white text-xl rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg">
                        Try ABS Fixer Now
                    </button>
                </Link>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-gray-100 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} ABS Fixer. All rights reserved.
            </footer>
        </div>
    );
}
