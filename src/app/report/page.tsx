'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, CheckCircle, ShieldQuestion, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function ReportPage() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send message.');
      toast.success('Your message has been sent!');
      setIsSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gray-50">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-3xl font-bold">Message Received!</h1>
            <p className="text-muted-foreground mt-2 max-w-md">Thank you for your submission. The administration has been notified and will get back to you shortly if a response is needed.</p>
            <div className="mt-6">
                <Link href="/">
                    <Button>Back to Home</Button>
                </Link>
            </div>
        </motion.div>
    );
  }

  return (
    <>
      {/* --- Animated Background --- */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-gray-50">
        <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-blue-200/30 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-purple-200/30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>
    
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { staggerChildren: 0.2, duration: 0.5 } }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-5xl w-full"
        >
          {/* --- Left Column: Form --- */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            className="lg:col-span-3"
          >
            <Card className="border-0 shadow-2xl bg-white/60 backdrop-blur-xl">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/10 p-2 rounded-full w-fit">
                            <ShieldQuestion className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Report an Issue or Inquiry</CardTitle>
                    </div>
                    <CardDescription>Use this form for any complaints, problems, or questions. We'll get back to you as soon as possible.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                        <div className="space-y-2"><Label htmlFor="contact">Contact (Email/Phone)</Label><Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} required /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="message">Message</Label><Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} /></div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Send Message
                    </Button>
                  </form>
                </CardContent>
            </Card>
          </motion.div>

          {/* --- Right Column: Info & Support --- */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <Image src="/logo.png" alt="STG Tower Logo" width={100} height={100} className="mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Need Immediate Help?</h2>
                <p className="text-muted-foreground">
                    For urgent matters, please don't hesitate to contact us directly.
                </p>
            </div>
            <Separator />
            <div className="space-y-4">
                <Card className="bg-white/60 backdrop-blur-xl border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Phone className="h-6 w-6 text-primary flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Call Us</p>
                            <a href="tel:9822790665" className="text-muted-foreground hover:text-primary transition-colors">9822790665</a>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="bg-white/60 backdrop-blur-xl border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Mail className="h-6 w-6 text-primary flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Email Us</p>
                            <a href="mailto:stgtowerhouse@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">stgtowerhouse@gmail.com</a>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
