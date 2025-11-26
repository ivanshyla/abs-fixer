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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <span className="text-2xl font-semibold text-black tracking-tight" style={{ fontFamily: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif' }}>ABS.AI</span>
            </a>
            <div className="text-sm text-gray-500">AI-Powered Enhancement</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transform Your Photos with AI
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your photo, paint the area you want to enhance, and let our AI create natural, realistic results.
          </p>
        </div>

        {/* Editor */}
        <ImageEditor />
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 text-center text-gray-500 text-sm bg-white">
        © {new Date().getFullYear()} ABS.AI. All rights reserved. Tailwind inc.
      </footer>
    </div>
  );
}
