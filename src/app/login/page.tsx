'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Loader2, AlertCircle, Mail, KeyRound, Eye, EyeOff, ShieldCheck, Calendar, ChevronLeft } from 'lucide-react';
import { Toaster, toast } from 'sonner'; // Ultra-premium toast system
import NepaliDate from 'nepali-date-converter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      
      // Premium Sonner Toast
      toast.success('Login Successful', {
        description: 'Loading to your dashboard...',
        icon: '🔐',
        duration: 2500,
      });
      
      setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(msg);
      toast.error('Login Failed', {
        description: msg,
        duration: 4000,
      });
      setIsLoading(false);
    }
  };

  const iconVariants = {
    focused: { scale: 1.1, color: '#0B2863' }, // Premium Navy Blue
    unfocused: { scale: 1, color: '#94a3b8' }, // Slate 400
  };

  return (
    <>
      <Toaster 
        position="top-center" 
        richColors 
        theme="light"
        style={{ marginTop: 'env(safe-area-inset-top, 20px)' }}
        toastOptions={{
          style: { borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -5px rgb(0 0 0 / 0.1)' }
        }}
      />
      
      {/* --- Premium Animated Background --- */}
      <div className="flex items-center justify-center min-h-screen w-full bg-[#f8fafc] p-4 sm:p-8 relative overflow-hidden">
      {/* --- Premium Floating Back Button --- */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
        className="absolute top-5 left-5 sm:top-8 sm:left-8 z-50"
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

      {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 z-0 opacity-[0.4]">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-300 rounded-full filter blur-[120px] animate-blob mix-blend-multiply"></div>
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-200 rounded-full filter blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-indigo-200 rounded-full filter blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
        </div>
        
        {/* Floating Background Particles */}
        <ul className="absolute top-0 left-0 w-full h-full z-0 circles-light pointer-events-none">
            {Array.from({ length: 10 }).map((_, i) => <li key={i}></li>)}
        </ul>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, duration: 0.8 }}
          className="z-10 w-full max-w-5xl"
        >
          {/* --- Bank-Level Glassmorphism Card --- */}
          <Card className="w-full mx-auto shadow-[0_20px_70px_-10px_rgba(11,40,99,0.15)] bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            
            {/* Left Panel - Branding (Desktop) */}
            <div className="hidden md:flex relative flex-col justify-between p-12 text-white overflow-hidden">
                <Image 
                  src="/building.jpg" 
                  alt="STG Tower" 
                  fill 
                  style={{objectFit: 'cover'}}
                  className="z-0 scale-105"
                  priority 
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B2863] via-[#0B2863]/60 to-transparent z-10"></div>
                
                {/* Top Logo */}
                <div className="relative z-20">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                           {/* Explicit width/height avoids 'sizes' warning */}
                           <Image src="/home.png" alt="Logo" width={36} height={36} className="object-contain drop-shadow-md" />
                        </div>
                        <span className="text-2xl font-black tracking-tight drop-shadow-md">STG TOWER</span>
                    </motion.div>
                </div>

                {/* Bottom Copy */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="relative z-20 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest shadow-sm">
                       <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure Portal
                    </div>
                    <h2 className="text-4xl font-black tracking-tight leading-tight drop-shadow-lg">
                      Your Living<br/>  Your Comfort.
                    </h2>
                    <p className="text-blue-50/90 font-medium leading-relaxed max-w-sm drop-shadow-md">
Manage your bills, request maintenance, and stay connected—all in one place.
                    </p>
                </motion.div>
            </div>
            
            {/* Right Panel - Login Form */}
            <div className="p-8 sm:p-12 flex flex-col justify-center bg-white/50 relative">
              <CardHeader className="text-center p-0 mb-8 space-y-2">
                {/* Logo for Mobile */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="flex justify-center items-center mb-6 md:hidden">
                    <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-100">
                       {/* Explicit width/height avoids 'sizes' warning */}
                       <Image src="/home.png" alt="Logo" width={56} height={56} className="object-contain" priority />
                    </div>
                </motion.div>
                
                <CardTitle className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2863]">Welcome Back</CardTitle>
                <CardDescription className="text-slate-500 font-semibold flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {todayBS}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  
                  {/* Email Field with AutoFill */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative group">
                      <motion.div variants={iconVariants} animate={focused === 'email' ? 'focused' : 'unfocused'} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <Mail className="h-5 w-5 transition-colors" />
                      </motion.div>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        autoComplete="email"
                        placeholder="name@stgtower.com" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        onFocus={() => setFocused('email')} 
                        onBlur={() => setFocused(null)} 
                        className={cn(
                          "pl-12 h-14 bg-white/80 border-slate-200 text-base font-medium rounded-2xl shadow-sm transition-all duration-300",
                          "focus:bg-white focus:ring-2 focus:ring-[#0B2863]/20 focus:border-[#0B2863]",
                          "hover:border-slate-300"
                        )}
                      />
                    </div>
                  </div>

                  {/* Password Field with AutoFill */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label htmlFor="password" className="text-sm font-bold text-slate-700">Password</label>
                      <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-[#0B2863] font-bold transition-colors" tabIndex={-1}>
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative group">
                      <motion.div variants={iconVariants} animate={focused === 'password' ? 'focused' : 'unfocused'} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <KeyRound className="h-5 w-5 transition-colors" />
                      </motion.div>
                      <Input 
                        id="password" 
                        name="password"
                        type={showPassword ? "text" : "password"} 
                        autoComplete="current-password"
                        placeholder="••••••••" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        onFocus={() => setFocused('password')} 
                        onBlur={() => setFocused(null)} 
                        className={cn(
                          "pl-12 pr-12 h-14 bg-white/80 border-slate-200 text-base font-medium rounded-2xl shadow-sm transition-all duration-300",
                          "focus:bg-white focus:ring-2 focus:ring-[#0B2863]/20 focus:border-[#0B2863]",
                          "hover:border-slate-300 tracking-wider placeholder:tracking-normal"
                        )}
                      />
                      {/* Premium Show/Hide Password Toggle */}
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B2863] transition-colors focus:outline-none z-10 p-2 rounded-xl hover:bg-slate-100"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Error State */}
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }} 
                        animate={{ opacity: 1, y: 0, height: 'auto' }} 
                        exit={{ opacity: 0, y: -10, height: 0 }} 
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-3 p-3 mt-1 rounded-xl bg-red-50 border border-red-100 text-sm font-bold text-red-600">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <span className="leading-tight">{error}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <div className="pt-4 pb-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className={cn(
                        "w-full h-14 rounded-2xl font-bold text-lg text-white transition-all duration-300 transform-gpu",
                        "bg-[#0B2863] hover:bg-blue-800",
                        "hover:shadow-[0_10px_40px_-10px_rgba(11,40,99,0.5)] hover:-translate-y-0.5",
                        "active:scale-[0.98] active:translate-y-0 active:shadow-none"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      ) : (
                        <LogIn className="w-5 h-5 mr-2" />
                      )}
                      {isLoading ? 'Authenticating...' : 'Secure Login'}
                    </Button>
                  </div>
                </form>
                
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* --- Smooth Animated Background CSS --- */}
      <style jsx global>{`
        .circles-light {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 5;
          pointer-events: none;
        }
        .circles-light li {
          position: absolute;
          display: block;
          list-style: none;
          width: 20px;
          height: 20px;
          background: rgba(11, 40, 99, 0.03);
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