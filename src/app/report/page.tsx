'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, CheckCircle, ShieldQuestion, Phone, Mail, ChevronLeft } from 'lucide-react';
import { toast, Toaster } from 'sonner'; // Upgraded to premium sonner toast
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function ReportPage() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send message.');

      toast.success('Message Received!', {
        description: 'The administration has been securely notified.',
        duration: 4000,
      });
      setIsSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="relative z-10 flex flex-col items-center justify-center p-10 md:p-16 bg-white/70 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-slate-200/50 max-w-lg text-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-4">Transmission Successful</h1>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">Your report has been encrypted and securely delivered to the Administration desk. We will reach out shortly to your provided contact.</p>
          <div className="w-full">
            <Button asChild size="lg" className="w-full h-16 rounded-[1.5rem] bg-[#0B2863] hover:bg-blue-800 text-white font-black text-lg shadow-[0_10px_30px_rgba(11,40,99,0.2)] transition-all duration-300 transform active:scale-95">
              <Link href="/">Return to Registry</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors theme="light" style={{ marginTop: 'env(safe-area-inset-top, 20px)' }} toastOptions={{ style: { borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -5px rgb(0 0 0 / 0.1)' } }} />

      {/* --- PREMIUM LIGHT BACKGROUND --- */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-[#F8FAFC]">
        {/* Animated Mesh Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/50 rounded-full filter blur-[120px] animate-blob mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-100/60 rounded-full filter blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-purple-100/50 rounded-full filter blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply"></div>

        {/* Background Noise Texture */}
        <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-[0.4] pointer-events-none mix-blend-overlay"></div>
      </div>

      {/* --- PREMIUM FLOATING BACK BUTTON --- */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
        className="absolute top-5 left-5 sm:top-8 sm:left-8 z-50 fixed"
      >
        <Link href="/">
          <Button
            variant="outline"
            className="flex items-center gap-1.5 sm:gap-2 bg-white/50 hover:bg-white/90 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(11,40,99,0.15)] rounded-[1.25rem] h-10 sm:h-12 px-3 sm:px-5 text-[#0B2863] font-black text-xs sm:text-sm transition-all duration-300 hover:-translate-y-1 active:scale-95 transform-gpu"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 -ml-1" strokeWidth={3} />
            <span className="hidden sm:inline">Back to Website</span>
            <span className="inline sm:hidden">Back</span>
          </Button>
        </Link>
      </motion.div>

      <div className="flex items-center justify-center min-h-screen p-4 py-24 relative z-10 w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 max-w-6xl w-full"
        >
          {/* --- LEFT COLUMN: Form --- */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Card className="border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] bg-white/70 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-white/40 border-b border-slate-100/50 p-8">
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-blue-50 p-3 rounded-2xl shadow-inner border border-blue-100/50">
                    <ShieldQuestion className="h-7 w-7 text-[#0B2863]" />
                  </div>
                  <CardTitle className="text-3xl font-black tracking-tight text-slate-900">Incident Report</CardTitle>
                </div>
                <CardDescription className="text-slate-500 font-medium text-base">Directly alert our administrative nodes. Your submission will be handled urgently and confidentially.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-black tracking-widest uppercase text-slate-500 ml-1">Full Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-14 bg-white/60 border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#0B2863]/20 focus:border-[#0B2863] rounded-2xl font-bold transition-all shadow-sm" placeholder="Your Name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact" className="text-xs font-black tracking-widest uppercase text-slate-500 ml-1">Contact Anchor</Label>
                      <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} required className="h-14 bg-white/60 border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#0B2863]/20 focus:border-[#0B2863] rounded-2xl font-bold transition-all shadow-sm" placeholder="Email or Phone" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-xs font-black tracking-widest uppercase text-slate-500 ml-1">Subject</Label>
                    <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="h-14 bg-white/60 border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#0B2863]/20 focus:border-[#0B2863] rounded-2xl font-bold transition-all shadow-sm" placeholder="Brief subject..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs font-black tracking-widest uppercase text-slate-500 ml-1">Detailed Logs</Label>
                    <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} className="bg-white/60 border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#0B2863]/20 focus:border-[#0B2863] rounded-2xl font-medium transition-all shadow-sm resize-none p-4" placeholder="Describe the issue extensively..." />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={isLoading} className="w-full h-16 rounded-[1.5rem] bg-[#0B2863] hover:bg-blue-800 text-white shadow-[0_10px_30px_rgba(11,40,99,0.2)] hover:shadow-[0_15px_40px_rgba(11,40,99,0.35)] font-black text-lg transition-all duration-300 transform active:scale-95 relative overflow-hidden group">
                      {isLoading ? (
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                          <Send className="mr-2 h-5 w-5 relative z-10" />
                        </>
                      )}
                      <span className="relative z-10">{isLoading ? 'Transmitting...' : 'Initiate Secure Transmission'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* --- RIGHT COLUMN: Info & Support --- */}
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2 flex flex-col justify-center">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center lg:text-left">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 mx-auto lg:mx-0 border border-slate-100">
                <Image src="/logo.png" alt="STG Tower Logo" width={40} height={40} />
              </div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Direct Channel.</h2>
              <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                For Level 1 urgent operational faults, please bypass the form log and contact control directly below.
              </p>
            </motion.div>

            <Separator className="bg-slate-200/50" />

            <div className="space-y-4 w-full">
              <motion.a initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} href="tel:9822790665" className="block w-full">
                <Card className="bg-white/60 hover:bg-white focus:bg-white backdrop-blur-xl border border-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-[1.5rem] group cursor-pointer active:scale-95">
                  <CardContent className="p-5 flex items-center gap-5">
                    <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl group-hover:bg-[#0B2863] group-hover:text-white transition-colors">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-widest uppercase text-slate-400 mb-1">Voice Protocol</p>
                      <p className="font-bold text-lg text-slate-800 tracking-tight">9822790665</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.a>
              <motion.a initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} href="mailto:stgtowerhouse@gmail.com" className="block w-full">
                <Card className="bg-white/60 hover:bg-white focus:bg-white backdrop-blur-xl border border-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-[1.5rem] group cursor-pointer active:scale-95">
                  <CardContent className="p-5 flex items-center gap-5">
                    <div className="bg-emerald-50 text-emerald-500 p-3 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-widest uppercase text-slate-400 mb-1">Email Relay</p>
                      <p className="font-bold text-lg text-slate-800 tracking-tight">stgtowerhouse@gmail.com</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dynamic Keyframes injected into CSS */}
      <style jsx global>{`
        @keyframes animate-blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
            animation: animate-blob 7s infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </>
  );
}
