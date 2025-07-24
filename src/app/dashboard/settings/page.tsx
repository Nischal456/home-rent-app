'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';
import { Loader2, User, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { IUser } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const passwordFormSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required.'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters.')
    .regex(/[A-Z]/, 'Must contain an uppercase letter.')
    .regex(/[0-9]/, 'Must contain a number.'),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function SettingsPage() {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { oldPassword: '', newPassword: '' },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Failed to connect to the server.');
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred.');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  async function onSubmit(values: PasswordFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('🔐 Password updated successfully!');
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="bg-white/70 backdrop-blur-xl border border-gray-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-sky-600" />
              My Profile
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your personal and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-40" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="text-red-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            ) : (
              <AnimatePresence>
                {user && (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div>
                      <p className="text-muted-foreground font-medium">Full Name</p>
                      <p>{user.fullName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Email</p>
                      <p>{user.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Phone</p>
                      <p>{user.phoneNumber || 'N/A'}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Section */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <Card className="bg-white/70 backdrop-blur-xl border border-gray-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <KeyRound className="w-5 h-5 text-yellow-600" />
              Change Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Use a strong password for better security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Old Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showOld ? 'text' : 'password'} {...field} />
                          <button
                            type="button"
                            onClick={() => setShowOld(!showOld)}
                            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                          >
                            {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showNew ? 'text' : 'password'} {...field} />
                          <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                          >
                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

