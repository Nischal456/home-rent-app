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
import { Toaster, toast } from 'sonner'; // Upgraded to premium Sonner toasts
import { Loader2, User, KeyRound, AlertCircle, Eye, EyeOff, Settings, ShieldCheck, Mail, Phone, Camera } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IUser } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [isUploading, setIsUploading] = useState(false);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
             ctx.drawImage(img, 0, 0, width, height);
             const base64String = canvas.toDataURL("image/webp", 0.7);
             
             try {
                 const res = await fetch('/api/users/profile-picture', {
                     method: 'PATCH',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ profilePicture: base64String })
                 });
                 if (res.ok) {
                     setUser(prev => prev ? { ...prev, profilePicture: base64String } : prev);
                     toast.success("Profile picture updated!");
                     // Reload to update layout headers
                     setTimeout(() => window.location.reload(), 1500);
                 } else {
                     const errData = await res.json();
                     toast.error(errData.message || "Upload failed");
                 }
             } catch(err) { toast.error("Failed to update"); }
             finally { setIsUploading(false); }
        }
      };
    };
  };

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
      
      toast.success('Password Updated', {
        description: 'Your security credentials have been successfully changed.',
        icon: '🔐',
        duration: 3000,
      });
      form.reset();
    } catch (err) {
      toast.error('Update Failed', {
        description: err instanceof Error ? err.message : 'Something went wrong.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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

      <div className="relative min-h-[calc(100vh-5rem)] w-full overflow-hidden bg-[#f8fafc] flex flex-col items-center p-4 md:p-8">
        
        {/* --- Premium Animated Background --- */}
        <div className="absolute inset-0 z-0 opacity-[0.35] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-300 rounded-full filter blur-[120px] animate-blob mix-blend-multiply"></div>
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-200 rounded-full filter blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-indigo-200 rounded-full filter blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
        </div>

        <div className="max-w-3xl w-full relative z-10 py-6 space-y-8">
          
          {/* --- Page Header --- */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-8 md:mb-12"
          >
            <div className="inline-flex items-center justify-center p-4 bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-3xl mb-6 transform hover:scale-105 transition-transform duration-300">
              <div className="p-3 bg-blue-50 text-[#0B2863] rounded-2xl">
                 <Settings className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0B2863] mb-4 drop-shadow-sm">
              Account Settings
            </h1>
            <p className="text-lg font-medium text-slate-500 max-w-xl mx-auto leading-relaxed">
              Manage your personal information and security preferences.
            </p>
          </motion.div>

          {/* --- Profile Section Card --- */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-[#0B2863]"></div>
              
              <CardHeader className="pt-8 pb-4 px-6 md:px-10 flex flex-row items-start gap-5 space-y-0 relative">
                <div className="relative group/avatar cursor-pointer">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleImageUpload} disabled={isUploading || isLoading} />
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-white shadow-lg bg-blue-50">
                     <AvatarImage src={user?.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.fullName}`} className="object-cover" />
                     <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-bold">{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity z-10">
                     {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                    My Profile
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium text-base mt-1">
                    Your personal and contact information.
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="px-6 md:px-10 pb-8">
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/50 p-6 rounded-3xl border border-slate-100">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-3 w-20 rounded-full" />
                        <Skeleton className="h-6 w-48 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 font-bold">
                    <AlertCircle className="w-5 h-5" /> {error}
                  </div>
                ) : (
                  <AnimatePresence>
                    {user && (
                      <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/50 p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="space-y-1.5">
                          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            <User className="w-3.5 h-3.5" /> Full Name
                          </p>
                          <p className="text-lg font-black text-slate-800">{user.fullName}</p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            <Mail className="w-3.5 h-3.5" /> Email Address
                          </p>
                          <p className="text-lg font-bold text-slate-700 break-all">{user.email}</p>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            <Phone className="w-3.5 h-3.5" /> Phone Number
                          </p>
                          <p className="text-lg font-bold text-slate-700">{user.phoneNumber || 'N/A'}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* --- Password Section Card --- */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-amber-500"></div>
              
              <CardHeader className="pt-8 pb-4 px-6 md:px-10 flex flex-row items-start gap-5 space-y-0">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-[1.25rem] shadow-inner group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <KeyRound className="w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                    Security
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium text-base mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Use a strong password to protect your account.
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="px-6 md:px-10 pb-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white/50 p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    
                    {/* Old Password Field */}
                    <FormField
                      control={form.control}
                      name="oldPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-bold text-slate-700 ml-1">Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showOld ? 'text' : 'password'} 
                                {...field} 
                                placeholder="Enter current password"
                                className={cn(
                                  "pl-4 pr-12 h-14 bg-white/80 border-slate-200 text-base font-medium rounded-2xl shadow-sm transition-all duration-300",
                                  "focus:bg-white focus:ring-2 focus:ring-[#0B2863]/20 focus:border-[#0B2863]",
                                  "hover:border-slate-300 tracking-wider placeholder:tracking-normal"
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowOld(!showOld)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B2863] transition-colors p-2 rounded-xl hover:bg-slate-100"
                                tabIndex={-1}
                              >
                                {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs font-bold ml-1" />
                        </FormItem>
                      )}
                    />

                    {/* New Password Field */}
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-bold text-slate-700 ml-1">New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showNew ? 'text' : 'password'} 
                                {...field} 
                                placeholder="Enter new password"
                                className={cn(
                                  "pl-4 pr-12 h-14 bg-white/80 border-slate-200 text-base font-medium rounded-2xl shadow-sm transition-all duration-300",
                                  "focus:bg-white focus:ring-2 focus:ring-[#0B2863]/20 focus:border-[#0B2863]",
                                  "hover:border-slate-300 tracking-wider placeholder:tracking-normal"
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B2863] transition-colors p-2 rounded-xl hover:bg-slate-100"
                                tabIndex={-1}
                              >
                                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs font-bold ml-1" />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className={cn(
                          "w-full h-14 rounded-2xl font-bold text-lg text-white transition-all duration-300 transform-gpu",
                          "bg-gradient-to-r from-[#0B2863] to-blue-700",
                          "hover:shadow-[0_10px_40px_-10px_rgba(11,40,99,0.5)] hover:-translate-y-0.5",
                          "active:scale-[0.98] active:translate-y-0 active:shadow-none flex items-center justify-center gap-2"
                        )}
                      >
                        {isSubmitting ? (
                           <>
                             <Loader2 className="w-5 h-5 animate-spin" /> Updating...
                           </>
                        ) : (
                           <>
                             <ShieldCheck className="w-5 h-5 text-blue-200" /> Update Password
                           </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}