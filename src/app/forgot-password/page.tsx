'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
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
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="z-10 w-full max-w-md"
        >
          <Card className="w-full mx-auto shadow-xl bg-white border">
            <CardHeader className="text-center">
              <Image src="/logo.png" alt="Logo" width={60} height={60} className="mx-auto rounded-full" />
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 mt-4">
                {isSuccess ? 'Request Sent' : 'Forgot Your Password?'}
              </CardTitle>
              <CardDescription className="text-slate-500 pt-1">
                {isSuccess 
                  ? `Your request has been sent to the admin. You will be contacted shortly.`
                  : "Enter your email and we will send a notification to the admin to reset your password."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">The STG Tower administration has been notified. They will contact you with your new temporary password.</p>
                  <Button asChild className="mt-6 w-full"><Link href="/login">Back to Login</Link></Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      id="email" type="email" placeholder="name@example.com" required 
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12" 
                    />
                  </div>
                  <div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                      {isLoading ? 'Sending Request...' : 'Request Reset'}
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