'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, DollarSign, Wrench, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

// The FeatureCard now has its animation defined directly inside it.
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div 
    // Animation props are now here instead of using variants
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100"
  >
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-600 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </motion.div>
);

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-10 p-4 sm:p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="STG Tower Logo" width={32} height={32} />
            <span className="font-semibold text-lg">STG Tower</span>
          </div>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center">
        <div className="container mx-auto px-4 py-20 text-center">
          
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto">
            {/* ✅ FIX: Replaced variants with direct animation props */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"
            >
              Effortless Rental Management
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              className="text-lg sm:text-xl text-gray-600 mb-8"
            >
              Welcome to STG Tower. Manage your bills, request maintenance, and stay connected—all in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            >
              <Button size="lg" asChild className="group bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                <Link href="/login">
                  Access Your Portal
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Features Section */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <FeatureCard
              icon={<DollarSign className="w-6 h-6" />}
              title="Seamless Payments"
              description="View and pay your rent and utility bills online with a clear, itemized history of all your transactions."
            />
            <FeatureCard
              icon={<Wrench className="w-6 h-6" />}
              title="Instant Maintenance"
              description="Submit maintenance requests directly through the portal and track their status from pending to completed."
            />
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="Digital Records"
              description="Access your complete statement and important documents anytime, anywhere. No more lost paperwork."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6">
        <div className="container mx-auto text-center text-sm text-gray-500">
          © {new Date().getFullYear()} STG Tower Management. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}