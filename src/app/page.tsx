'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import {
  ArrowRight, ShieldCheck, ArrowUpDown, Sparkles,
  Wrench, Phone, Mail, BedDouble, Soup, Sofa, Bath,
  ChevronRight, Home, Key, MapPin, Building, Brush,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// --- Premium Number Counter ---
const AnimatedCounter = ({ to }: { to: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsInView(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2500; // Slower premium easing
      const frameDuration = 1000 / 60;
      const totalFrames = Math.round(duration / frameDuration);
      const step = to / totalFrames;

      const counter = () => {
        // Easing function for smooth deceleration
        start += (to - start) * 0.1;
        if (to - start > 0.5) {
          setCount(Math.ceil(start));
          requestAnimationFrame(counter);
        } else {
          setCount(to);
        }
      };
      requestAnimationFrame(counter);
    }
  }, [isInView, to]);

  return <span ref={ref}>{count}</span>;
};

// --- Light Futuristic Bento Feature Card (Optimized) ---
const FeatureCard = ({ icon, title, description, className, delay = 0 }: { icon: React.ReactNode, title: string, description: string, className?: string, delay?: number }) => (
  // Reduced backdrop blur on mobile, optimized shadow and hover effects
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, ease: "easeOut", delay }}
    whileHover={{ y: -5 }}
    className={cn(
      "group relative overflow-hidden bg-white/80 md:bg-white/70 backdrop-blur-lg md:backdrop-blur-3xl p-6 md:p-8 rounded-[2rem]",
      "border border-slate-200/50 hover:border-blue-200 transition-all duration-300",
      "shadow-sm hover:shadow-xl",
      "will-change-transform",
      className
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

    <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-50 text-[#0B2863] mb-6 border border-blue-100 group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300 shadow-sm relative z-10 w-fit">
      {icon}
    </div>
    <h3 className="text-xl font-black mb-3 text-slate-800 tracking-tight relative z-10">{title}</h3>
    <p className="text-sm text-slate-500 font-medium leading-relaxed relative z-10">{description}</p>
  </motion.div>
);

// --- MAIN HOMEPAGE COMPONENT ---
export default function HomePage() {
  const containerRef = useRef(null);

  // Parallax / Scroll Storytelling Mapping
  const { scrollY, scrollYProgress } = useScroll();
  const videoScale = useTransform(scrollY, [0, 1200], [1.15, 1]); // Slow zooming out on scroll
  const videoOpacity = useTransform(scrollY, [0, 800], [1, 0.2]); // Brightest at top
  const heroTextY = useTransform(scrollY, [0, 500], [0, 120]); // Subtly falls down

  // Smooth Scroll Physics Initialization (Lenis)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like easing
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);


  return (
    <div ref={containerRef} className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#0B2863]/20 overflow-x-hidden">

      {/* 🚀 CRITICAL CSS INJECTION FOR 0-LAG AUTO-SCROLL */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes animate-blob {
          0% { transform: translate3d(0px, 0px, 0px) scale(1); }
          33% { transform: translate3d(30px, -50px, 0px) scale(1.1); }
          66% { transform: translate3d(-20px, 20px, 0px) scale(0.9); }
          100% { transform: translate3d(0px, 0px, 0px) scale(1); }
        }
        @keyframes smooth-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-blob {
            animation: animate-blob 7s infinite;
        }
        .animate-marquee-premium {
            animation: smooth-marquee 35s linear infinite;
            width: max-content;
        }
        @media (max-width: 768px) {
            .animate-marquee-premium {
                animation-duration: 25s; /* Slightly faster on small screens */
            }
        }
        .animate-marquee-premium:hover {
            animation-play-state: paused;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .mask-edges {
            -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}} />


      {/* --- SMART LIGHT HEADER --- */}
      <motion.header
        style={{
          backgroundColor: useTransform(scrollYProgress, [0, 0.05], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)']),
          backdropFilter: useTransform(scrollYProgress, [0, 0.05], ['blur(0px)', 'blur(24px)']),
          borderBottom: useTransform(scrollYProgress, [0, 0.05], ['1px solid rgba(226,232,240,0)', '1px solid rgba(226,232,240,0.8)'])
        }}
        className="fixed top-0 left-0 w-full z-50 p-4 sm:p-6 transition-all duration-500 will-change-transform"
      >
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center transform group-hover:rotate-12 group-hover:shadow-md transition-all duration-500">
              <Image src="/home.png" alt="Logo" width={26} height={26} />
            </div>
            <span className="font-black tracking-widest text-lg text-slate-800 uppercase hidden sm:inline-block" style={{ textShadow: "0 2px 10px rgba(255,255,255,0.8)" }}>STG TOWER</span>
          </Link>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex items-center gap-2 md:gap-4">
            {/* NEXT-LEVEL MOBILE VISIBLE TERMS PILL */}
            <Button asChild variant="outline" className="flex items-center text-[10px] md:text-sm text-slate-600 hover:text-[#0B2863] font-black tracking-wide rounded-full h-9 px-3 md:h-12 md:px-5 bg-white/50 backdrop-blur-md border border-slate-200/50 hover:bg-white hover:border-blue-200 shadow-sm transition-all outline-none duration-300">
              <Link href="/terms">
                <span className="sm:hidden">Terms</span>
                <span className="hidden sm:inline">Terms & Policies</span>
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-[#0B2863] hover:bg-blue-800 text-white shadow-[0_8px_30px_rgb(11,40,99,0.15)] hover:shadow-[0_12px_40px_rgba(11,40,99,0.3)] font-black px-4 md:px-6 h-9 md:h-12 text-xs md:text-sm transition-all transform hover:scale-105 active:scale-95 duration-300">
              <Link href="/login" className="flex items-center gap-1.5 md:gap-2">
                <span className="hidden sm:inline">Tenant Area</span>
                <span className="inline sm:hidden">Portal</span>
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-70" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.header>

      <main className="flex-grow relative z-10 w-full overflow-hidden">

        {/* =========================================
            CINEMATIC BRIGHT HERO SECTION (Parallax Optimized)
        ============================================= */}
        <section className="relative h-[110vh] flex items-center justify-center overflow-hidden pb-32">
          {/* Base Background Ambient Pearl */}
          <div className="absolute inset-0 bg-[#F8FAFC] z-[-2]"></div>

          {/* Parallax Video Container (Brightened) */}
          {/* Reduced computationally expensive mix-blends and giant blur radii on mobile */}
          <motion.div
            style={{ scale: videoScale, opacity: videoOpacity }}
            className="fixed top-0 left-0 w-full h-[120vh] z-[-1] pointer-events-none will-change-transform bg-white/50"
          >
            <video
              autoPlay loop muted playsInline
              className="w-full h-full object-cover opacity-30 md:opacity-60 mix-blend-luminosity md:mix-blend-normal"
              poster="/building.jpg"
            >
              <source src="/hero-video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-[#F8FAFC]/50 to-[#F8FAFC] z-20"></div>

            {/* Organic Moving Light Gradients (Lower Blur, No Mix-Blend Multiply on Mobile for speed) */}
            <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] bg-blue-200/40 rounded-full blur-3xl md:blur-[100px] opacity-60 pointer-events-none animate-pulse will-change-transform"></div>
            <div className="absolute bottom-[20%] right-[10%] w-[50vw] h-[50vw] bg-emerald-100/40 rounded-full blur-3xl md:blur-[100px] opacity-50 pointer-events-none will-change-transform"></div>
          </motion.div>

          <motion.div
            style={{ y: heroTextY }}
            className="relative z-10 max-w-5xl mx-auto px-4 text-center mt-24"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Badge variant="outline" className="mb-6 py-1.5 px-5 rounded-full border-blue-200 bg-blue-50/80 backdrop-blur-xl text-blue-700 tracking-widest font-black uppercase text-xs shadow-sm">
                <Building className="w-3.5 h-3.5 mr-2 text-blue-500 inline" /> Redefining Urban Living
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-bold tracking-tighter mb-6 leading-[1.05]"
              style={{ textShadow: "0px 10px 40px rgba(11,40,99,0.1)" }}
            >
              <span className="block text-slate-800">The Future Of</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0B2863] via-blue-600 to-cyan-500">Residency.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.6 }}
              className="text-lg sm:text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto font-medium leading-relaxed"
            >
              A visionary space blending high-end security, seamless utility management, and supreme daily comfort.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-5 justify-center items-center"
            >
              <Button
                size="lg" asChild
                className="group bg-[#0B2863] text-white hover:bg-blue-800 shadow-[0_15px_40px_rgba(11,40,99,0.25)] hover:shadow-[0_20px_50px_rgba(11,40,99,0.4)] rounded-[1.5rem] h-16 px-10 text-base font-black transition-all duration-500 overflow-hidden relative"
              >
                <Link href="/login">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                  <span className="relative z-10 flex items-center">Open Dashboard <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1.5" /></span>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-[1.5rem] h-16 px-10 text-slate-700 font-bold border-slate-300 bg-white/50 hover:bg-white hover:border-[#0B2863]/30 backdrop-blur-xl transition-all duration-300 text-base shadow-sm">
                <Link href="/report">Quick Report</Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* =========================================
            LIGHT GLASSMORPHISM BENTO GRID (Specs Optimized)
        ============================================= */}
        {/* Swapped heavy rgba drop-shadows to lighter tailwind shadows */}
        <section className="relative z-20 py-24 md:py-32 bg-white rounded-t-[3rem] -mt-10 border-t border-slate-100 shadow-xl overflow-hidden">
          {/* Subtle Background within Section */}
          <div className="absolute inset-0 z-0 bg-slate-50/50 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full max-w-3xl h-full bg-gradient-to-br from-blue-50/30 via-transparent to-transparent pointer-events-none"></div>

          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
              className="text-center mb-16 md:mb-24"
            >
              <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight text-slate-900">Precision Engineered <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">For Your Peace.</span></h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-xl font-medium px-4">Every dimension of STG Tower is calculated to abstract away the friction of daily life, secured natively by code and staff.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative">
              <FeatureCard delay={0.1} icon={<ShieldCheck className="w-7 h-7" />} title="24/7 Security" description="Professional staff and surveillance ensure your safety and peace of mind around the clock." className="lg:col-span-1 shadow-sm hover:border-blue-200" />
              <FeatureCard delay={0.2} icon={<ArrowUpDown className="w-7 h-7" />} title="Elevator Service" description="Reliable and well-maintained lift access to all 8 floors for your convenience." className="lg:col-span-1" />
              <FeatureCard delay={0.3} icon={<Brush className="w-7 h-7" />} title="Daily Cleaning" description="Impeccable hygiene in all common areas is maintained by our dedicated daily cleaning crew." className="lg:col-span-1" />
              <FeatureCard delay={0.4} icon={<Wrench className="w-7 h-7" />} title="On-Call Maintenance" description="Our on-call plumbing and electrical support is just a quick report away." className="lg:col-span-1 shadow-sm hover:border-emerald-200" />

              {/* Large Premium White Metric Spread */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="bg-white border border-slate-200 p-8 md:p-14 rounded-[2rem] shadow-xl hover:shadow-2xl transition-shadow lg:col-span-4 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-8 overflow-hidden relative group will-change-transform"
              >
                {/* Clean Aura inside card (Reduced Blur) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-blue-50/50 to-emerald-50/50 blur-xl md:blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-lg">
                  <Badge variant="outline" className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm font-black tracking-widest uppercase text-[10px] md:text-xs"> ⭐️ Trust</Badge>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tighter text-slate-800"><AnimatedCounter to={14} />+ Years of Excellence.</h3>
                  <p className="text-slate-500 font-medium text-base md:text-lg leading-relaxed">With over a decade of experience, we have a proven track record of providing stable, high-quality residential management.

                  </p>
                </div>
                {/* Interactive Rings Visual */}
                <div className="relative z-10 w-40 h-40 md:w-64 md:h-64 shrink-0 flex items-center justify-center bg-slate-50/80 rounded-full border border-slate-100 shadow-inner overflow-hidden">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }} className="absolute inset-2 border border-blue-200 rounded-full border-dashed"></motion.div>
                  <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }} className="absolute inset-8 border border-emerald-200 rounded-full border-dotted"></motion.div>
                  <div className="text-center">
                    <span className="block text-4xl font-black text-[#0B2863]">100%</span>
                    <span className="text-xs text-slate-400 font-black uppercase tracking-widest">Uptime</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================================
            LIGHT STORYTELLING / PARALLAX SECTIONS (Optimized)
        ============================================= */}
        {/* Removed mix-blend and saturate-200 from iframe as they kill mobile frame rate */}
        <section className="py-20 md:py-32 bg-[#F8FAFC] relative z-20">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              {/* Sticky Map Visual Illusion (Bright Mode) */}
              {/* We no longer use CSS filters on iframe for mobile performance */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
                className="h-[350px] md:h-[500px] lg:h-[700px] w-full rounded-[2rem] overflow-hidden relative border border-slate-200 shadow-xl group bg-white will-change-transform"
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.6559425031382!2d85.30725247606229!3d27.6970268761886!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1934a0ce6437%3A0x54ac6c30cd5690d6!2sStg%20Tower!5e0!3m2!1sen!2snp!4v1761551305205!5m2!1sen!2snp"
                  className="w-full h-full opacity-90 transition-opacity duration-300"
                  style={{ border: 0 }}
                  loading="lazy" referrerPolicy="no-referrer-when-downgrade">
                </iframe>
                <div className="absolute bottom-8 left-8 z-20 bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 shadow-xl">
                  <h4 className="text-xl font-black text-slate-800 flex items-center gap-2"><MapPin className="text-emerald-500 w-5 h-5 shrink-0" /> STG TOWER</h4>
                  <p className="text-slate-500 mt-1 text-sm font-black tracking-widest uppercase">Bhotebahal, KTM, Nepal</p>
                </div>
              </motion.div>

              {/* Text Storytelling */}
              <div className="space-y-12 lg:pr-12">
                <div className="space-y-6">
                  <Badge className="bg-[#0B2863] text-white hover:bg-blue-800 px-4 py-1.5 text-xs tracking-widest uppercase font-black rounded-full shadow-md">Architecture</Badge>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900">Designed for <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Modern Living.</span></h2>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed">Each of our thoughtfully designed flats across all 8 floors offers the perfect blend of comfort and functionality.</p>
                </div>

                <Separator className="bg-slate-200" />

                <div className="space-y-8">
                  {[
                    { title: "Two Spacious Bedrooms", desc: "Comfortable and private rooms designed for rest and relaxation after a long day.", icon: BedDouble },
                    { title: "Comfortable Living Room", desc: "A welcoming space for family gatherings, entertainment, or simply unwinding.", icon: Sofa },
                    { title: "Modern Kitchen", desc: "A well-equipped space to accommodate all your culinary needs and adventures.", icon: Soup },
                    { title: "Well-Appointed Washroom", desc: "Clean and functional, featuring modern fittings for your daily comfort.", icon: Bath }
                  ].map((spec, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: i * 0.1 }} className="flex gap-4 md:gap-6 group cursor-default">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 group-hover:bg-[#0B2863] group-hover:border-[#0B2863] group-hover:text-white text-slate-500 md:group-hover:scale-105 transition-all duration-300">
                        <spec.icon className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <div className="pt-1">
                        <h4 className="text-lg md:text-xl font-black tracking-tight text-slate-800 mb-1 leading-none md:leading-normal">{spec.title}</h4>
                        <p className="text-slate-500 font-medium text-sm md:text-base leading-snug md:leading-normal">{spec.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            TESTIMONIALS SECTION
        ============================================= */}
        <section className="py-24 md:py-32 bg-white relative z-20 border-t border-slate-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none"></div>

          {/* Soft background glows */}
          <div className="absolute top-[10%] left-[-5%] w-[30vw] h-[30vw] bg-blue-100/40 rounded-full blur-3xl md:blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[40vw] h-[40vw] bg-emerald-50/50 rounded-full blur-3xl md:blur-[100px] pointer-events-none"></div>

          <div className="max-w-[1600px] mx-auto pt-6 pb-20 relative z-10 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10 md:mb-16 flex flex-col items-center"
            >
              {/* Premium Google Reviews Integration Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.05)] mb-6 transition-transform hover:scale-105 duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
                  <span className="font-black text-slate-800 text-sm">5.0</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FBBC05" className="w-3.5 h-3.5 text-[#FBBC05]">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Google Reviews</span>
              </div>

              <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight text-slate-900">
                Trusted By <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Families.</span>
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium px-4">
                Hear directly from the residents and businesses who have actively chosen STG Tower as their space in Kathmandu.
              </p>
            </motion.div>

            {/* 0-Lag Pure JSX Infinite Marquee */}
            <div className="relative flex overflow-hidden w-[105%] left-[-2.5%] pt-10 pb-20 mask-edges group">
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 55 }}
                className="flex w-max will-change-transform"
              >
                {[
                  { name: "Shreeson Shrestha", role: "3 weeks ago", text: "Our stay at this rental home was absolutely amazing! The house was spotless, beautifully furnished, and had every amenity we could possibly need.", isHighlighted: false, color: "bg-slate-800" },
                  { name: "Sonu Dangol", role: "3 weeks ago", text: "I've been working from STG Tower for a few months now, and it's been a fantastic experience. The workspace is clean, well-maintained, and offers a professional atmosphere.", isHighlighted: false, color: "bg-purple-800" },
                  { name: "Shrijal Sthapit", role: "3 weeks ago", text: "The building is always so clean, and the security makes me feel very safe. Having a digital portal for bills is a huge plus.", isHighlighted: false, color: "bg-indigo-600" },
                  { name: "Anjal shrestha", role: "Local Guide • 4 months ago", text: "The management is incredibly responsive. Any issue I've reported has been handled the same day. It's the most professional rental experience I've had in Kathmandu.", isHighlighted: false, color: "bg-stone-600" },
                  { name: "Gecko Works Nepal Pvt Ltd", role: "5 months ago", text: "STG Tower offers a great workspace environment  with clean, professional, and ideal for IT and digital marketing companies like ours, Gecko Works Nepal Pvt. Ltd.", isHighlighted: true, color: "bg-[#84cc16]" },
                  { name: "Manindra Joshi", role: "5 months ago", text: "Excellent Service", isHighlighted: false, color: "bg-blue-800" },
                  // DUPED ARRAY TO CREATE INFINITE LOOP
                  { name: "Shreeson Shrestha", role: "3 weeks ago", text: "Our stay at this rental home was absolutely amazing! The house was spotless, beautifully furnished, and had every amenity we could possibly need.", isHighlighted: false, color: "bg-slate-800" },
                  { name: "Sonu Dangol", role: "3 weeks ago", text: "I've been working from STG Tower for a few months now, and it's been a fantastic experience. The workspace is clean, well-maintained, and offers a professional atmosphere.", isHighlighted: false, color: "bg-purple-800" },
                  { name: "Shrijal Sthapit", role: "3 weeks ago", text: "The building is always so clean, and the security makes me feel very safe. Having a digital portal for bills is a huge plus.", isHighlighted: false, color: "bg-indigo-600" },
                  { name: "Anjal shrestha", role: "Local Guide • 4 months ago", text: "The management is incredibly responsive. Any issue I've reported has been handled the same day. It's the most professional rental experience I've had in Kathmandu.", isHighlighted: false, color: "bg-stone-600" },
                  { name: "GECKO", role: "5 months ago", text: "STG Tower offers a great workspace environment with clean, professional, and ideal for IT and digital marketing companies like ours, Gecko Works Nepal Pvt. Ltd.", isHighlighted: true, color: "bg-[#84cc16]" },
                  { name: "Manindra Joshi", role: "5 months ago", text: "Excellent Service", isHighlighted: false, color: "bg-blue-800" }
                ].map((t, i) => (
                  <div
                    key={i}
                    className={`mr-6 w-[280px] md:w-[350px] shrink-0 relative p-6 md:p-8 rounded-3xl transition-all duration-700 hover:-translate-y-2 group/card flex flex-col will-change-transform ${t.isHighlighted
                      ? "bg-gradient-to-br from-white to-emerald-50/80 border-2 border-emerald-400 shadow-[0_15px_40px_rgba(16,185,129,0.15)] z-20 scale-[1.02]"
                      : "bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_40px_rgba(11,40,99,0.12)] hover:border-blue-200"
                      }`}
                  >
                    {/* Highlight Badge for Gecko Works */}
                    {t.isHighlighted && (
                      <div className="absolute -top-3 right-6 bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest z-20 flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        Featured
                      </div>
                    )}

                    {/* Inner ambient glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-emerald-50/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 rounded-3xl pointer-events-none"></div>

                    {/* Stars & Google Logo row */}
                    <div className="flex text-[#FBBC05] mb-5 relative z-10 items-center justify-between">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star, idx) => (
                          <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-4 h-4 text-[#FBBC05] fill-[#FBBC05] group-hover/card:scale-110 transition-transform duration-500"
                            style={{ transitionDelay: `${idx * 50}ms` }}
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 opacity-40 grayscale group-hover/card:grayscale-0 group-hover/card:opacity-100 transition-all duration-500">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                    </div>

                    <p className={`font-medium text-sm md:text-base mb-6 relative z-10 leading-relaxed transition-colors duration-500 ${t.isHighlighted ? 'text-slate-800' : 'text-slate-600 group-hover/card:text-slate-900'}`}>
                      &quot;{t.text}&quot;
                    </p>

                    <div className="flex items-center gap-3 relative z-10 mt-auto">
                      <div className={`w-10 h-10 rounded-full relative overflow-hidden flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0 ${t.color}`}>
                        <span className="relative z-10">{t.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className={`font-black text-sm md:text-base tracking-tight leading-none mb-1 transition-colors ${t.isHighlighted ? 'text-emerald-700' : 'text-slate-900 group-hover/card:text-[#0B2863]'}`}>
                          {t.name}
                        </h4>
                        <p className="text-[10px] md:text-[11px] text-slate-500 font-semibold tracking-wide">
                          {t.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================================
            FINAL CTA (Bright & Elegant, Mobile Fast)
        ============================================= */}
        <section className="relative py-24 md:py-48 text-slate-900 overflow-hidden bg-white border-t border-slate-100 shadow-sm z-20">
          {/* Replaced heavy mix-blend with simple opacity gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full bg-blue-100/30 blur-3xl md:blur-[100px] pointer-events-none"></div>

          <div className="max-w-4xl relative z-10 mx-auto px-4 text-center flex flex-col items-center">
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl border border-slate-100 flex items-center justify-center mb-8 shadow-lg relative">
              <Home className="w-10 h-10 md:w-12 md:h-12 text-[#0B2863] relative z-10" />
            </motion.div>

            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tighter text-slate-900">Take The Key.</motion.h2>

            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }} className="text-xl text-slate-500 mb-12 max-w-xl mx-auto font-medium">
              Step into a friction-free ecosystem designed entirely around your lifestyle.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto"
            >
              <Button size="lg" asChild className="w-full sm:w-auto group bg-[#0B2863] text-white hover:bg-blue-800 shadow-[0_15px_30px_rgba(11,40,99,0.2)] hover:shadow-[0_20px_40px_rgba(11,40,99,0.3)] rounded-full h-16 px-10 text-lg font-black transition-all duration-500 overflow-hidden relative">
                <Link href="/login">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                  Access Terminal <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto rounded-full h-16 px-10 text-slate-700 font-bold border-slate-300 bg-white/50 hover:bg-white hover:border-[#0B2863]/30 backdrop-blur-xl transition-all duration-300 text-base shadow-sm">
                <Link href="/terms">Terms & Condtions</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* --- REDESIGNED LIGHT FOOTER --- */}
      <footer className="w-full pt-20 pb-12 bg-white text-slate-600 border-t border-slate-200 relative z-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-16">

            <div className="md:col-span-1">
              <Link href="/" className="inline-block mb-6">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                  <Image src="/home.png" alt="Logo" width={28} height={28} />
                </div>
                <span className="font-black text-2xl text-slate-800 tracking-widest uppercase" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>STG TOWER</span>
              </Link>
              <p className="text-sm font-semibold text-slate-500 max-w-xs leading-relaxed">Elevated standards in real estate management software and residential care.</p>
            </div>

            <div>
              <h3 className="font-black text-slate-900 mb-6 tracking-widest uppercase text-sm">System</h3>
              <ul className="space-y-4 text-sm font-bold">
                <li><Link href="/login" className="hover:text-[#0B2863] transition-colors flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" /> Tenant Portal</Link></li>
                <li><Link href="/report" className="hover:text-[#0B2863] transition-colors flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm" /> Maintenance</Link></li>
                <li><Link href="/terms" className="hover:text-[#0B2863] transition-colors">Legal Terms</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-black text-slate-900 mb-6 tracking-widest uppercase text-sm">Contact</h3>
              <div className="space-y-4 text-sm font-bold">
                <a href="tel:9822790665" className="flex items-center gap-3 hover:text-[#0B2863] transition-colors group"><Phone className="h-4 w-4 group-hover:text-blue-500" /> 9822790665</a>
                <a href="mailto:stgtowerhouse@gmail.com" className="flex items-center gap-3 hover:text-[#0B2863] transition-colors group"><Mail className="h-4 w-4 group-hover:text-blue-500" /> stgtowerhouse@gmail.com</a>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-200 mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-bold text-slate-400">
            <p>© {new Date().getFullYear()} STG Tower . All Rights Reserved.</p>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></span>
              <span>Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}