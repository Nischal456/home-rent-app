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
      // The httpOnly cookie is set by the server, no client-side token management is needed.
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh(); // Force a refresh to ensure layout gets new cookie data
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      toast.error(err.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div></div>
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="w-full max-w-md mx-4 shadow-2xl bg-white/80 backdrop-blur-sm dark:bg-gray-950/80">
            <CardHeader className="text-center">
              <motion.div className="mx-auto mb-4" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <img src="/logo.png" alt="Logo" className="h-20 w-20 object-contain" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">STG Tower Management</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">{todayBS}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="tenant@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="dark:bg-gray-800 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="dark:bg-gray-800 dark:text-white" />
                </div>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center p-2 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </motion.div>
                )}
                <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                  {isLoading ? 'Verifying...' : 'Login'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} STG Tower Inc. All rights reserved.</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
