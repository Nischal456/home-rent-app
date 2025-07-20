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
import Image from 'next/image'; // ✅ FIX: Import Next.js Image component

// Animation variants for a staggered fade-in effect
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get current date in Nepali format
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
      // ✅ FIX: Safely handle the error type
      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-gray-950 p-4">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#d1c4e9,transparent)]"></div>
        </div>
        
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Card className="w-full max-w-sm mx-auto shadow-xl bg-white/80 backdrop-blur-lg border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50">
            <CardHeader className="text-center space-y-2">
              <motion.div variants={itemVariants} className="mx-auto">
                {/* ✅ FIX: Replaced <img> with <Image> for optimization */}
                <Image src="/logo.png" alt="Logo" width={64} height={64} className="object-contain" />
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardTitle className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">STG Tower Login</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400 pt-1">{todayBS}</CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-400" />
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-400" />
                </motion.div>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center p-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
                <motion.div variants={itemVariants}>
                  <Button type="submit" className="w-full font-semibold text-base py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 transition-opacity" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                    {isLoading ? 'Verifying...' : 'Secure Login'}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} STG Tower Inc.</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  );
}