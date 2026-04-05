'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { BellRing, ShieldCheck, AlertCircle, Info, Sparkles, Send, Loader2, Users, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const pushFormSchema = z.object({
  targetGroup: z.enum(['TENANTS', 'SECURITY', 'ALL', 'SPECIFIC_TENANT', 'SPECIFIC_SECURITY']),
  targetUserId: z.string().optional(),
  type: z.enum(['GENERAL', 'ALERT', 'IMPORTANT']),
  title: z.string().min(3, 'Title is required (min 3 chars).'),
  message: z.string().min(5, 'Message body is required.')
}).refine(data => {
  if ((data.targetGroup === 'SPECIFIC_TENANT' || data.targetGroup === 'SPECIFIC_SECURITY') && !data.targetUserId) {
    return false;
  }
  return true;
}, {
  message: "You must select a specific user.",
  path: ["targetUserId"]
});

type PushFormValues = z.infer<typeof pushFormSchema>;

export default function PushNotificationsPage() {
  const [isSending, setIsSending] = useState(false);

  // Data Fetching for specific users
  const { data: tenantsData } = useSWR('/api/tenants', fetcher);
  const { data: guardsData } = useSWR('/api/security-guards', fetcher);

  const form = useForm<PushFormValues>({
    resolver: zodResolver(pushFormSchema),
    defaultValues: {
      targetGroup: 'TENANTS',
      type: 'GENERAL',
      title: '',
      message: ''
    }
  });

  const previewType = form.watch("type");
  const previewTitle = form.watch("title");
  const previewMessage = form.watch("message");

  const getIconForType = (t: string) => {
    switch (t) {
      case 'ALERT': return <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertCircle className="w-5 h-5" /></div>;
      case 'IMPORTANT': return <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Info className="w-5 h-5" /></div>;
      default: return <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><BellRing className="w-5 h-5" /></div>;
    }
  };

  const getBadgeForType = (t: string) => {
    switch (t) {
      case 'ALERT': return <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Critical Alert</span>;
      case 'IMPORTANT': return <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Important</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">General Notice</span>;
    }
  };

  async function onSubmit(values: PushFormValues) {
    setIsSending(true);
    try {
      const payload = {
        ...values,
        targetGroup: values.targetGroup.startsWith('SPECIFIC') ? 'SPECIFIC' : values.targetGroup
      };

      const res = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success('Pushed Successfully', {
        description: data.message,
        icon: '🚀'
      });

      form.reset({ targetGroup: values.targetGroup, type: 'GENERAL', title: '', message: '', targetUserId: '' });
    } catch (err) {
      toast.error('Push Failed', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <Toaster
        position="top-center"
        richColors
        theme="light"
        style={{ marginTop: 'calc(env(safe-area-inset-top, 60px) + 50px)', zIndex: 99999 }}
        toastOptions={{
          style: {
            borderRadius: '16px',
            boxShadow: '0 20px 40px -5px rgba(0,0,0,0.1)'
          }
        }}
      />
      <div className="relative min-h-[calc(100vh-5rem)] w-full overflow-hidden bg-[#f8fafc] flex flex-col items-center">

        {/* --- Background --- */}
        <div className="absolute inset-0 z-0 opacity-[0.35] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-300 rounded-full filter blur-[120px] mix-blend-multiply"></div>
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-200 rounded-full filter blur-[120px] mix-blend-multiply"></div>
        </div>

        <div className="max-w-5xl w-full relative z-10 space-y-8">

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-white/60 backdrop-blur-md shadow-sm rounded-3xl mb-4">
              <div className="p-3 bg-blue-50 text-[#0B2863] rounded-2xl"><BellRing className="h-8 w-8" /></div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[#0B2863] mb-3">Push Notification Center</h1>
            <p className="text-sm font-medium text-slate-500 max-w-xl mx-auto">Send mass broadcasts, critical alerts, or important notices instantly across the STG Tower platform.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Form Section */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
              <Card className="border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-[#0B2863]"></div>
                <CardHeader className="px-6 md:px-8 pt-8">
                  <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Compose Broadcast</CardTitle>
                </CardHeader>
                <CardContent className="px-6 md:px-8 pb-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="targetGroup" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Target Audience</FormLabel>
                            <Select onValueChange={(v) => { field.onChange(v); form.setValue('targetUserId', ''); }} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-14 bg-white border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm"><SelectValue placeholder="Select Recipient Group" /></SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="ALL" className="font-bold py-3"><div className="flex items-center gap-2"><BellRing className="w-4 h-4 text-orange-500" /> Entire Network</div></SelectItem>
                                <SelectItem value="TENANTS" className="font-bold py-3"><div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> All Tenants</div></SelectItem>
                                <SelectItem value="SPECIFIC_TENANT" className="font-bold py-3 pl-8 text-blue-600"><span className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> Specific Tenant...</span></SelectItem>
                                <SelectItem value="SECURITY" className="font-bold py-3"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> All Security Guards</div></SelectItem>
                                <SelectItem value="SPECIFIC_SECURITY" className="font-bold py-3 pl-8 text-emerald-600"><span className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> Specific Guard...</span></SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="type" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><BellRing className="w-3.5 h-3.5" /> Notification Style</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-14 bg-white border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm"><SelectValue placeholder="Select Type" /></SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="GENERAL" className="font-bold py-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> General Notice</div></SelectItem>
                                <SelectItem value="IMPORTANT" className="font-bold py-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Important</div></SelectItem>
                                <SelectItem value="ALERT" className="font-bold py-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Critical Alert</div></SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>

                      <AnimatePresence>
                        {(form.watch("targetGroup") === 'SPECIFIC_TENANT' || form.watch("targetGroup") === 'SPECIFIC_SECURITY') && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <FormField control={form.control} name="targetUserId" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><User className="w-3.5 h-3.5" /> Select Specific Person</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-14 bg-white border-slate-200 border-2 rounded-2xl font-bold text-[#0B2863] shadow-sm"><SelectValue placeholder="Search Person..." /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-xl max-h-60">
                                    {form.watch("targetGroup") === 'SPECIFIC_TENANT' && tenantsData?.data?.map((t: any) => (
                                      <SelectItem key={t._id} value={t._id} className="font-bold py-3">{t.fullName} <span className="text-slate-400 font-medium ml-1">({t.roomId?.roomNumber || 'No Room'})</span></SelectItem>
                                    ))}
                                    {form.watch("targetGroup") === 'SPECIFIC_SECURITY' && guardsData?.data?.map((g: any) => (
                                      <SelectItem key={g._id} value={g._id} className="font-bold py-3">{g.fullName}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-slate-500 uppercase">Message Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Scheduled Water Maintenance" {...field} className="h-14 bg-white border-slate-200 rounded-2xl font-bold text-lg text-slate-900 shadow-sm placeholder:font-medium placeholder:text-slate-400" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-slate-500 uppercase">Message Body</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Please be informed that..." {...field} className="min-h-[120px] bg-white border-slate-200 rounded-2xl p-4 font-medium text-slate-700 shadow-sm resize-none placeholder:text-slate-400" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <Button type="submit" disabled={isSending} className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#0B2863] to-blue-700 hover:from-blue-700 hover:to-[#0B2863] text-white font-bold text-lg shadow-[0_8px_20px_rgb(11,40,99,0.2)] active:scale-95 transition-all">
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <div className="flex items-center justify-center gap-2"><Send className="w-5 h-5" /> Push Broadcast</div>}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Live Preview Section */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
              <div className="sticky top-[100px] flex flex-col gap-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Live App Preview</h3>

                <div className="bg-white border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.06)] rounded-[2rem] p-6 relative overflow-hidden group">
                  {/* Phone Notch Mockup */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-100 rounded-b-3xl"></div>

                  <p className="text-[10px] font-bold text-slate-300 text-center mt-4 mb-6">User Screen Representation</p>

                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={previewType}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "flex gap-4 p-4 rounded-2xl border transition-colors",
                        previewType === 'ALERT' ? 'bg-red-50/50 border-red-100' :
                          previewType === 'IMPORTANT' ? 'bg-amber-50/50 border-amber-100' :
                            'bg-blue-50/50 border-blue-100'
                      )}
                    >
                      <div className="shrink-0">{getIconForType(previewType)}</div>
                      <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                        {getBadgeForType(previewType)}
                        <p className="font-extrabold text-slate-900 leading-tight line-clamp-2">{previewTitle || 'Enter a title above...'}</p>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed max-h-20 overflow-hidden text-ellipsis">{previewMessage || 'Your message will appear here exactly as typed.'}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">Just now</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100/50 mt-4">
                  <Info className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">Pushed notifications arrive in real-time instantly synchronizing across all devices.</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
}
