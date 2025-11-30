"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DEMO_MODE } from "@/lib/envFlags";

const ImageEditor = dynamic(() => import("../../components/ImageEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
});

const isDemoMode = DEMO_MODE;

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-darkest text-brand-lightest relative overflow-hidden">
      {/* Header */}
      <header className="border-b border-brand-medium bg-brand-darkest/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <span className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif' }}>ABS.AI</span>
            </Link>
            <div className="flex items-center gap-3 text-sm text-brand-light">
              <span>AI-Powered Enhancement</span>
              {isDemoMode && (
                <span className="uppercase text-xs font-semibold tracking-wide text-amber-200 bg-amber-500/10 border border-amber-400/40 px-2 py-1 rounded">
                  Demo mode
                </span>
              )}
            </div>
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
        {isDemoMode && (
          <div className="max-w-3xl mx-auto mb-10 bg-amber-500/10 border border-amber-400/40 text-amber-50 px-6 py-4 rounded-xl text-sm">
            Демо-режим включен: можно сразу тестировать интерфейс без Stripe, AWS и Supabase. Генерации используют подготовленный пример, так что всё работает «из коробки».
          </div>
        )}

        {/* Editor */}
        <ImageEditor />
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-brand-medium text-center text-brand-light text-sm bg-brand-darkest">
        © {new Date().getFullYear()} ABS.AI. All rights reserved. Tailwind inc.
      </footer>
    </div>
  );
}
