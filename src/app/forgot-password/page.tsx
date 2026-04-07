'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/request-admin-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred.');
      }
      toast.success(data.message);
      setIsSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        containerStyle={{
          top: 'calc(env(safe-area-inset-top, 20px) + 16px)'
        }}
      />
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#F8FAFC] p-4 relative overflow-hidden">
        {/* Ambient Background Shimmers */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-50/50 blur-[100px] pointer-events-none"></div>

        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, ease: "easeOut" }}
           className="w-full max-w-md mx-auto mb-6 z-10"
        >
            <Button asChild variant="outline" size="sm" className="h-10 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(11,40,99,0.08)] hover:border-blue-200 hover:bg-white transition-all duration-300 group inline-flex items-center gap-2 pl-3 px-5 cursor-pointer shrink-0">
                <Link href="/login">
                  <div className="bg-slate-100 group-hover:bg-[#0B2863]/10 p-1 rounded-full transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5 text-slate-500 group-hover:text-[#0B2863] group-hover:-translate-x-0.5 transition-all" />
                  </div>
                  <span className="font-bold text-slate-600 group-hover:text-[#0B2863] text-xs uppercase tracking-widest transition-colors pt-0.5">Back to Login</span>
                </Link>
            </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.1 }}
          className="z-10 w-full max-w-md relative"
        >
          <Card className="w-full mx-auto border border-white/60 shadow-[0_20px_80px_rgba(11,40,99,0.07)] rounded-[2.5rem] bg-white/70 backdrop-blur-3xl overflow-hidden relative group">
            {/* Inner ambient glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -z-10"></div>
            
            <CardHeader className="text-center pt-10 pb-6">
              <div className="mx-auto w-[72px] h-[72px] bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center transform group-hover:rotate-6 group-hover:scale-105 group-hover:shadow-md transition-all duration-500 mb-6">
                 <Image src="/home.png" alt="Logo" width={40} height={40} className="mx-auto" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 group-hover:text-[#0B2863] transition-colors duration-300">
                {isSuccess ? 'Check Your Inbox' : 'Reset Passport'}
              </CardTitle>
              <CardDescription className="text-slate-500 pt-2 font-medium leading-relaxed px-4">
                {isSuccess 
                  ? `Your secure request has been delivered. Management will reach out shortly.`
                  : "Enter your registered email address and we will dispatch a reset request to management."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              {isSuccess ? (
                <div className="text-center p-6 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100/50 relative overflow-hidden">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}>
                    <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-5 drop-shadow-sm" />
                  </motion.div>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">
                    The STG Tower core infrastructure has securely logged your request. You may close this page.
                  </p>
                  <Button asChild className="w-full h-12 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"><Link href="/login">Return to Terminal</Link></Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within/input:text-[#0B2863] transition-colors" />
                    <Input 
                      id="email" type="email" placeholder="name@example.com" required 
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 bg-white/80 backdrop-blur-sm border-slate-200/60 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50 rounded-2xl transition-all font-medium text-slate-800 placeholder:text-slate-400 text-base" 
                    />
                  </div>
                  <div>
                    <Button type="submit" className="w-full h-14 rounded-2xl bg-[#0B2863] hover:bg-blue-800 text-white font-black text-base md:text-lg shadow-[0_8px_30px_rgb(11,40,99,0.15)] hover:shadow-[0_12px_40px_rgba(11,40,99,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 duration-300 relative overflow-hidden" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-3 animate-spin relative z-10" />
                          <span className="relative z-10">Transmitting...</span>
                        </>
                      ) : (
                        <>
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                          <span className="relative z-10">Send Request</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}