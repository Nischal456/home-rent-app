'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Loader2, User, KeyRound } from 'lucide-react';
import { IUser } from '@/types';

const passwordFormSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function SettingsPage() {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) setUser(data.user);
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { oldPassword: '', newPassword: '' },
  });

  async function onSubmit(values: PasswordFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to change password.');
      toast.success('Password changed successfully!');
      form.reset();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User /> My Profile</CardTitle><CardDescription>Your personal and contact information.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* --- THE CORE FIX IS HERE --- */}
            {/* Replaced crashing <FormLabel> with a styled <p> tag for static text */}
            <div><p className="text-sm font-medium text-muted-foreground">Full Name</p><p>{user?.fullName}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Email</p><p>{user?.email}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Phone Number</p><p>{user?.phoneNumber || 'N/A'}</p></div>
            {/* --- END OF FIX --- */}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound /> Change Password</CardTitle><CardDescription>Update your login password.</CardDescription></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="oldPassword" render={({ field }) => (<FormItem><FormLabel>Old Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update Password</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
