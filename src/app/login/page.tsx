'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Loader2, AlertCircle, Mail, KeyRound } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import NepaliDate from 'nepali-date-converter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Make sure this import exists

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<null | 'email' | 'password'>(null);

  const todayBS = new NepaliDate().format('ddd, MMMM DD, YYYY', 'np');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed.');
      
      toast.success('Login Successful! Redirecting...');
      setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
    }
  };

  const iconVariants = {
    focused: { scale: 1.1, color: '#4f46e5' }, // indigo-600
    unfocused: { scale: 1, color: '#94a3b8' }, // slate-400
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* --- "Next Level" Animated Background --- */}
      <div className="flex items-center justify-center min-h-screen w-full bg-white p-4 relative overflow-hidden">
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 z-0 opacity-50">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Floating Squares (More subtle) */}
        <ul className="absolute top-0 left-0 w-full h-full z-0 circles-light">
            {Array.from({ length: 10 }).map((_, i) => <li key={i}></li>)}
        </ul>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 20, duration: 0.8, delay: 0.2 }}
          className="z-10 w-full max-w-4xl"
        >
          {/* --- Professional Glassmorphism Card --- */}
          <Card className="w-full mx-auto shadow-2xl bg-white/60 backdrop-blur-2xl border border-white/30 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            
            {/* Left Panel - Branding (Desktop) */}
            <div className="hidden md:flex relative flex-col justify-between p-10 text-white overflow-hidden">
                {/* ✅ IMAGE FIX: Added `fill`, `sizes`, and `alt` for Next.js 13+ */}
                <Image 
                  src="/building.jpg" 
                  alt="STG Tower" 
                  fill 
                  style={{objectFit: 'cover'}}
                  className="z-0"
                  priority 
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/30 to-gray-900/60 z-10"></div>
                <div className="relative z-20">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-full" />
                        <span className="text-xl font-bold">STG Tower</span>
                    </motion.div>
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="relative z-20">
                    <h2 className="text-3xl font-bold tracking-tight">Your Portal to Modern Living.</h2>
                    <p className="mt-2 text-gray-200/90">Manage your bills, request maintenance, and stay connected—all in one place.</p>
                </motion.div>
            </div>
            
            {/* Right Panel - Login Form */}
            <div className="p-8">
              <CardHeader className="text-center p-0 mb-8">
                {/* Logo for Mobile */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="flex justify-center items-center gap-3 mb-4 md:hidden">
                    <Image src="/logo.png" alt="Logo" width={80} height={80} className="full" />
                </motion.div>
                
                <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Sign In</CardTitle>
                <CardDescription className="text-slate-500 pt-1">{todayBS}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="relative">
                    <motion.div variants={iconVariants} animate={focused === 'email' ? 'focused' : 'unfocused'} className="absolute left-3 top-1/2 -translate-y-1/2"><Mail className="h-5 w-5" /></motion.div>
                    <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} className="pl-10 h-12 bg-slate-100 border-slate-200 focus:bg-white focus-visible:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="relative">
                       <motion.div variants={iconVariants} animate={focused === 'password' ? 'focused' : 'unfocused'} className="absolute left-3 top-1/2 -translate-y-1/2"><KeyRound className="h-5 w-5" /></motion.div>
                      <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} className="pl-10 h-12 bg-slate-100 border-slate-200 focus:bg-white focus-visible:ring-indigo-500" />
                    </div>
                    <div className="text-right">
                        <Link href="/forgot-password" className="text-sm text-indigo-600 hover:underline hover:text-indigo-700 font-medium">Forgot Password?</Link>
                    </div>
                  </div>
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} className="flex items-center text-sm font-medium text-red-600">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div>
                    <Button type="submit" className="w-full font-semibold text-base py-6 bg-indigo-600 text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98]" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                      {isLoading ? 'Verifying...' : 'Secure Login'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* --- This is the CSS for the light animated background --- */}
      <style jsx global>{`
        .circles-light {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 5;
        }
        .circles-light li {
          position: absolute;
          display: block;
          list-style: none;
          width: 20px;
          height: 20px;
          background: rgba(199, 210, 254, 0.4); /* indigo-200/40 */
          animation: animate-light 25s linear infinite;
          bottom: -150px;
        }
        .circles-light li:nth-child(1) { left: 25%; width: 80px; height: 80px; animation-delay: 0s; }
        .circles-light li:nth-child(2) { left: 10%; width: 20px; height: 20px; animation-delay: 2s; animation-duration: 12s; }
        .circles-light li:nth-child(3) { left: 70%; width: 20px; height: 20px; animation-delay: 4s; }
        .circles-light li:nth-child(4) { left: 40%; width: 60px; height: 60px; animation-delay: 0s; animation-duration: 18s; }
        .circles-light li:nth-child(5) { left: 65%; width: 20px; height: 20px; animation-delay: 0s; }
        .circles-light li:nth-child(6) { left: 75%; width: 110px; height: 110px; animation-delay: 3s; }
        .circles-light li:nth-child(7) { left: 35%; width: 150px; height: 150px; animation-delay: 7s; }
        .circles-light li:nth-child(8) { left: 50%; width: 25px; height: 25px; animation-delay: 15s; animation-duration: 45s; }
        .circles-light li:nth-child(9) { left: 20%; width: 15px; height: 15px; animation-delay: 2s; animation-duration: 35s; }
        .circles-light li:nth-child(10) { left: 85%; width: 150px; height: 150px; animation-delay: 0s; animation-duration: 11s; }
        @keyframes animate-light {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; border-radius: 0; }
          100% { transform: translateY(-1000px) rotate(720deg); opacity: 0; border-radius: 50%; }
        }
        @keyframes animate-blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </>
  );
}