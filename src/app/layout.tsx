import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// ✅ 1. Font Optimization: 'swap' ensures text is visible immediately.
// We also use CSS variables to prevent unnecessary re-renders.
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

// ✅ 2. "Next Level" SEO & Performance Metadata
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
  
  // ⚡ PERFORMANCE HACK: Stops mobile browsers from burning CPU to auto-link numbers/dates
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  
  // 📈 ADVANCED SEO: Tells Google exactly what to index and how to show previews
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },

  icons: {
    icon: "/home.png",
    shortcut: "/home.png",
    apple: "/home.png", 
  },
  
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "STG Tower Management",
    description: "Experience elevated living with our professional management portal.",
    siteName: "STG Tower",
    images: [
      {
        url: "/building.jpg", 
        width: 1200,
        height: 630,
        alt: "STG Tower Building",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "STG Tower Management",
    description: "Seamless rental management for modern living.",
    images: ["/building.jpg"], // Fixed to match OG image for consistency
  },
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // 📱 Native feel: transparent status bar on iOS
    title: "STG Tower",
  },
};

// ✅ 3. Viewport Optimization for "Fastest" Mobile Feel
export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // ⚡ Removes 300ms tap delay
  viewportFit: "cover", // 📱 Draws edge-to-edge behind notches/dynamic islands
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 'dir="ltr"' improves accessibility and SEO
    <html lang="en" dir="ltr" className="scroll-smooth"> 
      <body 
        className={`
          ${inter.variable} font-sans antialiased 
          bg-gray-50 text-gray-900 
          selection:bg-indigo-100 selection:text-indigo-900 
          min-h-[100dvh] flex flex-col overscroll-none
        `}
      >
        {/* CSS Class Breakdown for Smooth Engine:
          - 'font-sans': Uses the CSS variable for Inter smoothly.
          - 'antialiased': Hardware-accelerated font smoothing.
          - 'min-h-[100dvh]': Dynamic viewport height stops layout jumps when mobile URL bars hide/show.
          - 'flex flex-col': Standardizes layout painting for the browser engine.
          - 'overscroll-none': Stops the rubber-band bounce effect, making it feel native.
        */}
        {children}
      </body>
    </html>
  );
}