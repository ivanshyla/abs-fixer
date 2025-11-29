"use client";
import dynamic from "next/dynamic";

const ImageEditor = dynamic(() => import("../../components/ImageEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
});

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-darkest text-brand-lightest relative overflow-hidden">
      {/* Header */}
      <header className="border-b border-brand-medium bg-brand-darkest/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <span className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif' }}>ABS.AI</span>
            </a>
            <div className="text-sm text-brand-light">AI-Powered Enhancement</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Transform Your Photos with AI
          </h2>
          <p className="text-lg text-brand-lighter max-w-2xl mx-auto">
            Upload your photo, paint the area you want to enhance, and let our AI create natural, realistic results.
          </p>
        </div>

        {/* Editor */}
        <ImageEditor />
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-brand-medium text-center text-brand-light text-sm bg-brand-darkest">
        © {new Date().getFullYear()} ABS.AI. All rights reserved.
      </footer>
    </div>
  );
}
