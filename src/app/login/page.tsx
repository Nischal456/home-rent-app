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
      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }
      
      toast.success('Login Successful! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const iconVariants = {
    focused: { scale: 1.1, color: '#8b5cf6' }, // purple-500
    unfocused: { scale: 1, color: '#9ca3af' }, // slate-400
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex items-center justify-center min-h-screen w-full bg-slate-100 p-4 relative overflow-hidden">
        
        {/* Animated Particle Background */}
        <div className="absolute inset-0 z-0">
            <div id="particle-container">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div className="particle" key={i}></div>
                ))}
            </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="z-10 w-full max-w-4xl"
        >
          <Card className="w-full mx-auto shadow-2xl bg-white/80 backdrop-blur-2xl border border-white/30 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            {/* Left Panel - Branding (Visible on medium screens and up) */}
            <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                className="flex items-center gap-3"
              >
                <span className="text-xl font-bold">STG Tower</span>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
              >
                <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
                <p className="mt-2 text-indigo-100/90">Manage your property with ease. Enter your credentials to access your dashboard.</p>
              </motion.div>
              <p className="text-xs text-indigo-200/80">© {new Date().getFullYear()} STG Tower Inc.</p>
            </div>
            
            {/* Right Panel - Login Form */}
            <div className="p-8">
              <CardHeader className="text-center p-0 mb-8">
                {/* ✅ FIX: Logo is now visible on mobile screens */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                    className="flex justify-center items-center gap-3 mb-4 md:hidden"
                >
                    <Image src="/logo.png" alt="Logo" width={100} height={100} />
                </motion.div>
                
                <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Sign In</CardTitle>
                <CardDescription className="text-slate-500 pt-1">{todayBS}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="relative">
                    <motion.div
                      variants={iconVariants}
                      animate={focused === 'email' ? 'focused' : 'unfocused'}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                    >
                        <Mail className="h-5 w-5" />
                    </motion.div>
                    <Input 
                      id="email" type="email" placeholder="name@example.com" required 
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                      className="pl-10 h-12 bg-slate-100 border-slate-200 focus:bg-white focus-visible:ring-purple-500" 
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="relative">
                       <motion.div
                          variants={iconVariants}
                          animate={focused === 'password' ? 'focused' : 'unfocused'}
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                        >
                            <KeyRound className="h-5 w-5" />
                        </motion.div>
                      <Input 
                        id="password" type="password" placeholder="••••••••" required 
                        value={password} onChange={(e) => setPassword(e.target.value)} 
                        onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                        className="pl-10 h-12 bg-slate-100 border-slate-200 focus:bg-white focus-visible:ring-purple-500" 
                      />
                    </div>
                    <div className="text-right">
                        <Link href="#" className="text-sm text-purple-600 hover:underline hover:text-purple-700 font-medium">Forgot Password?</Link>
                    </div>
                  </div>
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="flex items-center text-sm font-medium text-red-600"
                      >
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div>
                    <Button 
                      type="submit" 
                      className="w-full font-semibold text-base py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-200 relative overflow-hidden group" 
                      disabled={isLoading}
                    >
                      <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white rounded-full group-hover:w-32 group-hover:h-32 opacity-10"></span>
                      <motion.span
                        className="flex items-center justify-center"
                        initial={{ x: 0 }}
                        animate={{ x: isLoading ? 0 : -4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Verifying...' : 'Secure Login'}
                      </motion.span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
}