import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://absai.app"),
  title: "ABS.ai - Body Enhancer",
  description: "Transform your photos with AI-powered abdominal enhancements.",
  openGraph: {
    title: "ABS.AI - Get 6-Pack Abs in Seconds",
    description:
      "Transform your photos instantly with AI. Natural, realistic abs tailored to your body. No gym required (yet).",
    url: "https://absai.app",
    siteName: "ABS.AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ABS.AI - AI-Powered Body Enhancement",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ABS.AI - Get 6-Pack Abs in Seconds",
    description:
      "Transform your photos instantly with AI. Natural, realistic abs tailored to your body.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon-new.svg?v=4",
    shortcut: "/favicon-new.svg?v=4",
    apple: "/favicon-new.svg?v=4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
