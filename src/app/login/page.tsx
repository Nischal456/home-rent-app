'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import NepaliDate from 'nepali-date-converter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const errorVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  shake: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } }
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const todayBS = new NepaliDate().format('dddd, MMMM DD, YYYY', 'np');

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
        throw new Error(data.message || 'Something went wrong');
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

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div 
        className="flex items-center justify-center min-h-screen w-full bg-gray-900 p-4"
        style={{ perspective: '1000px' }}
      >
        {/* Animated Aurora Background */}
        <div className="aurora-background"></div>
        
        <motion.div 
          // ✅ FIX: Replaced variants with direct animation props
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          whileHover={{ scale: 1.02, rotateY: 5, rotateX: -5 }}
        >
          <Card className="w-full max-w-sm mx-auto shadow-2xl bg-white/10 backdrop-blur-2xl border border-white/20 text-white">
            <CardHeader className="text-center space-y-2">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                className="mx-auto"
              >
                <Image src="/logo.png" alt="Logo" width={64} height={64} className="object-contain drop-shadow-lg" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
              >
                <CardTitle className="text-2xl font-bold tracking-tight">STG Tower Login</CardTitle>
                <CardDescription className="text-gray-300 pt-1">{todayBS}</CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/10 border-white/20 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-gray-400" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/10 border-white/20 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-gray-400" />
                </motion.div>
                {error && (
                  <motion.div 
                    variants={errorVariants}
                    initial="initial"
                    animate={["animate", "shake"]}
                    className="flex items-center p-3 text-sm font-medium text-red-300 bg-red-900/40 border border-red-500/50 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.5 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full font-semibold text-base py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white transition-all duration-300 transform hover:scale-105" 
                    disabled={isLoading}
                    // ✅ FIX: Removed the whileTap prop
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                    {isLoading ? 'Verifying...' : 'Secure Login'}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center mt-2">
                <p className="text-xs text-gray-400">© {new Date().getFullYear()} STG Tower Inc.</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  );
}