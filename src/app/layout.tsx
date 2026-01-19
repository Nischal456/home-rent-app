import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// ✅ 1. Font Optimization: 'swap' ensures text is visible immediately.
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

// ✅ 2. "Next Level" SEO Metadata
// This ensures your app looks professional when shared on social media (WhatsApp, Messenger, Facebook, etc.)
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://stgtower.com'),
  title: {
    default: "STG Tower Management",
    template: "%s | STG Tower",
  },
  description: "Professional Rental Management System for STG Tower. Manage rent, utilities, and maintenance requests seamlessly.",
  keywords: ["Rental Management", "STG Tower", "Kathmandu Apartments", "Tenant Portal", "Property Management"],
  authors: [{ name: "STG Tower Management" }],
  creator: "STG Tower",
  publisher: "STG Tower",
  manifest: "/manifest.json",
  icons: {
    icon: "/home.png",
    shortcut: "/home.png",
    apple: "/home.png", // High-res icon for iPhone home screen
  },
  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "STG Tower Management",
    description: "Experience elevated living with our professional management portal.",
    siteName: "STG Tower",
    images: [
      {
        url: "/building.jpg", // Make sure this image exists in public folder
        width: 1200,
        height: 630,
        alt: "STG Tower Building",
      },
    ],
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "STG Tower Management",
    description: "Seamless rental management for modern living.",
    images: ["/building-photo.jpg"],
  },
  // Apple Web App Capabilities
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "STG Tower",
  },
};

// ✅ 3. Viewport Optimization for "Fastest" Mobile Feel
// 'userScalable: false' removes the 300ms tap delay on mobile browsers.
export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Critical for "app-like" instant touch response
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth"> 
      <body 
        className={`${inter.className} antialiased bg-gray-50 text-gray-900 selection:bg-indigo-100 selection:text-indigo-900`}
      >
        {/* 'antialiased': Activates hardware acceleration for font rendering (smoother text).
          'selection:...': Custom highlight color for a premium feel.
        */}
        {children}
      </body>
    </html>
  );
}