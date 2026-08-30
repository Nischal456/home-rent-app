"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Zap, Wallet, CheckCircle, Hourglass, Share2, Printer, Shield, ChevronRight, Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PhoneScrollShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Animating phone container
  const phoneRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-6, 0, 6]);
  const phoneScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.9, 1.02, 1.02, 0.95]);
  const phoneY = useTransform(scrollYProgress, [0, 0.5, 1], [50, 0, -50]);

  // Card slide-ups inside phone screen
  const rentCardY = useTransform(scrollYProgress, [0.15, 0.35], [180, 0]);
  const rentCardOpacity = useTransform(scrollYProgress, [0.15, 0.32], [0, 1]);

  const utilCardY = useTransform(scrollYProgress, [0.38, 0.58], [180, 0]);
  const utilCardOpacity = useTransform(scrollYProgress, [0.38, 0.55], [0, 1]);

  const receiptCardY = useTransform(scrollYProgress, [0.6, 0.8], [180, 0]);
  const receiptCardOpacity = useTransform(scrollYProgress, [0.6, 0.78], [0, 1]);

  return (
    <div ref={containerRef} className="relative py-24 md:py-36 bg-[#F8FAFC] overflow-hidden">
      {/* Background blobs for premium depth */}
      <div className="absolute top-[20%] left-[-10%] w-[45vw] h-[45vw] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none transform-gpu" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-orange-200/20 rounded-full blur-[100px] pointer-events-none transform-gpu" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Floating details synced with scrolling */}
          <div className="lg:col-span-6 space-y-12 order-2 lg:order-1">
            <div className="space-y-4">
              <Badge className="bg-[#0B2863] text-white hover:bg-blue-800 px-4 py-1.5 text-xs tracking-widest uppercase font-black rounded-full shadow-md">
                Mobile First Portal
              </Badge>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Designed for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
                  Instant Access.
                </span>
              </h2>
              <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-lg">
                No laptops required. Manage rent payments, review utility meters, and download receipts directly on your phone with zero friction.
              </p>
            </div>

            <div className="space-y-8">
              {/* Feature 1 */}
              <motion.div 
                whileHover={{ x: 4 }}
                className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-lg leading-normal">Instant Rent Payments</h4>
                  <p className="text-slate-500 text-sm font-medium mt-0.5 leading-relaxed">
                    View active rents, calculate total dues, and trigger payments with visual verification badges.
                  </p>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                whileHover={{ x: 4 }}
                className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-orange-200"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-lg leading-normal">Utility Readings & Three-Phase</h4>
                  <p className="text-slate-500 text-sm font-medium mt-0.5 leading-relaxed">
                    Track daily water, traditional electricity, and three-phase meter details with full readings transparency.
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                whileHover={{ x: 4 }}
                className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-200"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-lg leading-normal">PDF Share & Print</h4>
                  <p className="text-slate-500 text-sm font-medium mt-0.5 leading-relaxed">
                    Instantly copy link or share bill statements straight to WhatsApp, or print hard-copy receipts directly.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* RIGHT COLUMN: Realistic 3D Mobile phone wrapper */}
          <div className="lg:col-span-6 flex justify-center order-1 lg:order-2">
            <motion.div
              style={{ scale: phoneScale, rotateZ: phoneRotate, y: phoneY }}
              className="relative w-[290px] h-[580px] md:w-[330px] md:h-[660px] rounded-[3.2rem] border-[12px] border-slate-900 bg-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] ring-4 ring-slate-800/30 overflow-hidden transform-gpu will-change-transform"
            >
              {/* Dynamic Island / Camera slot */}
              <div className="absolute top-3.5 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-full z-40 flex items-center justify-between px-3">
                <div className="w-2.5 h-2.5 bg-slate-800 rounded-full border border-slate-700/20" />
                <div className="w-1.5 h-1.5 bg-blue-900/30 rounded-full" />
              </div>

              {/* Phone Content Screen */}
              <div className="w-full h-full bg-[#F1F5F9] overflow-y-auto p-4 pt-14 flex flex-col gap-4 relative select-none styled-scrollbar">
                
                {/* Mock Header */}
                <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">STG Portal</p>
                    <h3 className="font-black text-slate-800 text-sm leading-tight">Dairy Shop</h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#0B2863] text-white flex items-center justify-center font-bold text-xs">
                    DS
                  </div>
                </div>

                {/* Animated Card 1: Rent Bill */}
                <motion.div
                  style={{ y: rentCardY, opacity: rentCardOpacity }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex flex-col gap-3 transform-gpu will-change-transform shrink-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <span className="font-black text-slate-700 text-xs">Rent Bill</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px] rounded-full">
                      PAID
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Period</p>
                      <p className="font-black text-slate-800 text-xs">Ashadh 2083</p>
                    </div>
                    <span className="font-black text-[#0B2863] text-sm">Rs 15,000</span>
                  </div>
                </motion.div>

                {/* Animated Card 2: Utility Bill (w/ Three Phase details) */}
                <motion.div
                  style={{ y: utilCardY, opacity: utilCardOpacity }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex flex-col gap-3 transform-gpu will-change-transform shrink-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="font-black text-slate-700 text-xs">Utility Bill</span>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[9px] rounded-full">
                      DUE
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-2 text-center text-[10px]">
                    <div>
                      <p className="font-bold text-slate-400 uppercase text-[8px]">Electricity</p>
                      <p className="font-extrabold text-slate-700">1 Unit = Rs 19</p>
                    </div>
                    <div className="border-l border-slate-200">
                      <p className="font-bold text-slate-400 uppercase text-[8px]">Water</p>
                      <p className="font-extrabold text-slate-700">1 Unit = Rs 0.3</p>
                    </div>
                  </div>

                  {/* Highlight: Three Phase details explicitly shown inside phone screen */}
                  <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-2.5 text-[9px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                      <span className="font-extrabold text-slate-700">Three Phase Meter</span>
                    </div>
                    <span className="font-black text-slate-800">5 Units (Rs 90)</span>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-100 pt-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Month: Ashadh</span>
                    <span className="font-black text-slate-800 text-sm">Rs 109.30</span>
                  </div>
                </motion.div>

                {/* Animated Card 3: Share popup and receipts */}
                <motion.div
                  style={{ y: receiptCardY, opacity: receiptCardOpacity }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex flex-col gap-3 transform-gpu will-change-transform shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-black text-slate-800 text-xs">Receipt Verified</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Method</p>
                      <p className="text-[9px] font-extrabold text-slate-700">eSewa Wallet</p>
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Paid Date</p>
                      <p className="text-[9px] font-extrabold text-slate-700">2083 Ashadh</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-1">
                    <div className="flex-1 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-1 text-[10px] font-black border border-blue-100 cursor-pointer transition-colors">
                      <Share2 className="w-3 h-3" />
                      <span>Share</span>
                    </div>
                    <div className="flex-1 h-9 rounded-xl bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-1 text-[10px] font-black cursor-pointer transition-colors">
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print PDF</span>
                    </div>
                  </div>
                </motion.div>
                
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
