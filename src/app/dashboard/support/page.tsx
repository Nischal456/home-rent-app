'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button'; // ✅ FIX: Added the missing import for the Button
import { LifeBuoy, Mail, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// --- MAIN SUPPORT PAGE COMPONENT ---
export default function SupportPage() {
  return (
    <>
      {/* --- Animated Background --- */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-gray-50/50">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-emerald-200/30 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-200/30 rounded-full filter blur-3xl animate-blob animation-delay-3000"></div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:py-12">
        {/* --- Page Header --- */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <LifeBuoy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">Get in Touch</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            We're here to help. Contact us through any of the channels below for a prompt response.
          </p>
        </div>

        {/* --- Contact Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Card className="h-full border-0 shadow-xl bg-white/60 backdrop-blur-xl text-center group">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="pt-4">Phone Support</CardTitle>
                <CardDescription>
                  For urgent issues, please give us a call. We are available during business hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="lg" className="w-full">
                  <a href="tel:9822790665">
                    Call 9822790665
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full border-0 shadow-xl bg-white/60 backdrop-blur-xl text-center group">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="pt-4">Email Support</CardTitle>
                <CardDescription>
                  For general inquiries and non-urgent matters, email is the best way to reach us.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="lg" className="w-full">
                  <a href="mailto:stgtowerhouse@gmail.com">
                    Email Us
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
