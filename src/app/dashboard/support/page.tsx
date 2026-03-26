'use client';

import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { LifeBuoy, Mail, Phone, ArrowRight, Clock, MessageSquarePlus, HeadphonesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SupportPage() {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full overflow-hidden bg-[#f8fafc] flex flex-col justify-center p-4 md:p-8">
      
      {/* --- Premium Animated Background --- */}
      <div className="absolute inset-0 z-0 opacity-[0.35] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-300 rounded-full filter blur-[120px] animate-blob mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-200 rounded-full filter blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-indigo-200 rounded-full filter blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10 py-6 md:py-10">
        
        {/* --- Sleek Page Header --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-3xl mb-6 transform hover:scale-105 transition-transform duration-300">
            <div className="p-3 bg-blue-50 text-[#0B2863] rounded-2xl flex items-center gap-2 pr-4">
               <HeadphonesIcon className="h-6 w-6" />
               <span className="font-extrabold text-sm tracking-wider uppercase">Support Center</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0B2863] mb-4 drop-shadow-sm">
            How can we help?
          </h1>
          <p className="text-base md:text-lg font-medium text-slate-500 max-w-xl mx-auto leading-relaxed">
            Our dedicated team is ready to assist you. Choose your preferred method below for a swift resolution.
          </p>
        </motion.div>

        {/* --- Horizontal "Control Panel" Cards (Fixes the "Big Box" issue) --- */}
        <div className="flex flex-col gap-5 md:gap-6">
          
          {/* Phone Support Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="relative overflow-hidden group border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] bg-white/70 backdrop-blur-xl rounded-[2rem] transition-all duration-300">
              {/* Left Accent Line (Desktop) / Top Accent Line (Mobile) */}
              <div className="absolute top-0 left-0 w-full md:w-1.5 h-1.5 md:h-full bg-gradient-to-b md:bg-gradient-to-r from-emerald-400 to-green-500"></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6 md:gap-8">
                
                {/* Icon & Text Content */}
                <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-5 md:gap-6 w-full">
                  <div className="shrink-0 p-4 md:p-5 bg-emerald-50 text-emerald-600 rounded-[1.25rem] shadow-inner group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <Phone className="h-7 w-7 md:h-8 md:w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Phone Support</h3>
                    <p className="text-slate-500 font-medium text-sm md:text-base max-w-md">
                      For urgent issues, emergencies, or immediate assistance, give us a call.
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-full border border-emerald-100 mt-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" /> Immediate Response
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="w-full md:w-auto shrink-0 mt-2 md:mt-0">
                  <Button asChild size="lg" className="w-full md:w-auto h-14 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25 font-bold text-base transform-gpu active:scale-[0.98] transition-all group/btn">
                    <a href="tel:9822790665" className="flex items-center justify-center">
                      Call 9822790665
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                    </a>
                  </Button>
                </div>

              </div>
            </Card>
          </motion.div>

          {/* Email Support Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="relative overflow-hidden group border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] bg-white/70 backdrop-blur-xl rounded-[2rem] transition-all duration-300">
              {/* Left Accent Line (Desktop) / Top Accent Line (Mobile) */}
              <div className="absolute top-0 left-0 w-full md:w-1.5 h-1.5 md:h-full bg-gradient-to-b md:bg-gradient-to-r from-blue-500 to-[#0B2863]"></div>

              <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6 md:gap-8">
                
                {/* Icon & Text Content */}
                <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-5 md:gap-6 w-full">
                  <div className="shrink-0 p-4 md:p-5 bg-blue-50 text-blue-600 rounded-[1.25rem] shadow-inner group-hover:scale-110 group-hover:bg-[#0B2863] group-hover:text-white transition-all duration-300">
                    <Mail className="h-7 w-7 md:h-8 md:w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Email Support</h3>
                    <p className="text-slate-500 font-medium text-sm md:text-base max-w-md">
                      For general inquiries, detailed documentation, and non-urgent matters.
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-blue-700 bg-blue-50/80 px-3 py-1.5 rounded-full border border-blue-100 mt-2">
                      <MessageSquarePlus className="w-3.5 h-3.5 text-blue-500" /> Replies within 24h
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="w-full md:w-auto shrink-0 mt-2 md:mt-0">
                  <Button asChild size="lg" className="w-full md:w-auto h-14 px-8 rounded-2xl bg-[#0B2863] hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20 font-bold text-base transform-gpu active:scale-[0.98] transition-all group/btn">
                    <a href="mailto:stgtowerhouse@gmail.com" className="flex items-center justify-center">
                      Email Us
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                    </a>
                  </Button>
                </div>

              </div>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  );
}