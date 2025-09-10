'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react'; // ✅ FIX: Added missing React hooks
import { ArrowRight, ShieldCheck, ArrowUpDown, Sparkles, Wrench, Phone, Mail, BedDouble, Soup, Sofa, Bath } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // ✅ FIX: Added missing import for 'cn'
import { Badge } from '@/components/ui/badge'; // ✅ FIX: Added missing import
import { Separator } from '@/components/ui/separator'; // ✅ FIX: Added missing import


// --- Reusable Animated Counter Component ---
const AnimatedCounter = ({ to }: { to: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const frameDuration = 1000 / 60;
      const totalFrames = Math.round(duration / frameDuration);
      const step = to / totalFrames;

      const counter = () => {
        start += step;
        if (start < to) {
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


// --- Reusable Feature Card Component for Bento Grid ---
const FeatureCard = ({ icon, title, description, className }: { icon: React.ReactNode, title: string, description: string, className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    whileInView={{ opacity: 1, scale: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className={cn("bg-white/50 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow border border-gray-100/50 backdrop-blur-md", className)}
  >
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4 mx-auto md:mx-0">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 text-gray-900 text-center md:text-left">{title}</h3>
    <p className="text-sm text-gray-600 text-center md:text-left">{description}</p>
  </motion.div>
);

// --- MAIN HOMEPAGE COMPONENT ---
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* --- HEADER --- */}
      <header className="absolute top-0 left-0 w-full z-20 p-4 sm:p-6 bg-gradient-to-b from-black/50 to-transparent">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-bold text-xl text-white">STG Tower</span>
          </Link>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Button asChild className="shadow-lg">
              <Link href="/login">Tenant Login</Link>
            </Button>
          </motion.div>
        </div>
      </header>

      <main className="flex-grow">
        
        {/* --- HERO SECTION with Video Background --- */}
        <section className="relative h-screen min-h-[700px] flex items-center justify-center text-white overflow-hidden">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute z-0 w-auto min-w-full min-h-full max-w-none"
              poster="/building.jpg"
            >
              <source src="/hero-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-black/50 z-10"></div>
            <div className="container relative z-20 mx-auto px-4 text-center">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-4"
                >
                  Experience Elevated Living
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl mx-auto"
                >
                  Discover the pinnacle of modern residency at STG Tower, where professional management meets premium facilities.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button size="lg" asChild className="group bg-white text-primary hover:bg-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:shadow-primary/30">
                    <Link href="/login">Access Tenant Portal <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="group bg-white/10 text-white border-white/50 hover:bg-white/20 backdrop-blur-md transition-all">
                    <Link href="/report">Report an Issue</Link>
                  </Button>
                </motion.div>
            </div>
        </section>

        {/* --- FACILITIES BENTO GRID SECTION --- */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose STG Tower?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">We combine modern infrastructure with a suite of professional services to provide an unparalleled living experience.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard icon={<ShieldCheck className="w-6 h-6" />} title="24/7 Security" description="Professional staff and surveillance ensure your safety and peace of mind around the clock." className="lg:col-span-1" />
              <FeatureCard icon={<ArrowUpDown className="w-6 h-6" />} title="Elevator Service" description="Reliable and well-maintained lift access to all 8 floors for your convenience." className="lg:col-span-1" />
              <FeatureCard icon={<Sparkles className="w-6 h-6" />} title="Daily Cleaning" description="Impeccable hygiene in all common areas is maintained by our dedicated daily cleaning crew." className="lg:col-span-1" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, ease: "easeOut" }} className="bg-primary text-primary-foreground p-8 rounded-2xl shadow-lg md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-6">
                <h3 className="text-2xl lg:text-3xl font-bold"><AnimatedCounter to={14} />+ Years of Excellence</h3>
                <p className="opacity-80 max-w-md">With over a decade of experience, we have a proven track record of providing stable, high-quality residential management.</p>
              </motion.div>
              <FeatureCard icon={<Wrench className="w-6 h-6" />} title="On-Call Maintenance" description="Our on-call plumbing and electrical support is just a quick report away." className="lg:col-span-3"/>
            </div>
          </div>
        </section>

        {/* --- TESTIMONIALS SECTION --- */}
        <section className="py-20 lg:py-28 bg-gray-50">
           <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our Tenants Say</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">We're proud to have built a community where residents feel valued and at home.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, delay: 0.1 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"><p className="text-gray-600 italic">"The management is incredibly responsive. Any issue I've reported has been handled the same day. It's the most professional rental experience I've had in Kathmandu."</p><p className="font-semibold mt-4">- Anjali S., Tenant</p></motion.div>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"><p className="text-gray-600 italic">"The building is always so clean, and the security makes me feel very safe. Having a digital portal for bills is a huge plus."</p><p className="font-semibold mt-4">- Bikram R., Tenant</p></motion.div>
                     <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, delay: 0.3 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"><p className="text-gray-600 italic">"STG Tower feels like more than just an apartment; it feels like a community. The management truly cares."</p><p className="font-semibold mt-4">- S. Gurung, Tenant</p></motion.div>
                </div>
           </div>
        </section>

  <section className="py-20 lg:py-28 bg-white">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">Designed for Modern Living</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">Each of our thoughtfully designed flats across all 8 floors offers the perfect blend of comfort and functionality.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard icon={<BedDouble className="w-6 h-6"/>} title="Two Spacious Bedrooms" description="Comfortable and private rooms designed for rest and relaxation after a long day."/>
                    <FeatureCard icon={<Sofa className="w-6 h-6"/>} title="Comfortable Living Room" description="A welcoming space for family gatherings, entertainment, or simply unwinding."/>
                    <FeatureCard icon={<Soup className="w-6 h-6"/>} title="Modern Kitchen" description="A well-equipped space to accommodate all your culinary needs and adventures."/>
                    <FeatureCard icon={<Bath className="w-6 h-6"/>} title="Well-Appointed Washroom" description="Clean and functional, featuring modern fittings for your daily comfort."/>
                </div>
            </div>
        </section>

{/* --- FINAL CTA --- */}
        <section className="relative py-20 lg:py-28 text-white overflow-hidden">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 z-0"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
          
          <div className="container relative z-10 mx-auto px-4 text-center">
             <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6 }}>
                <Badge variant="secondary" className="mb-4">Ready to Begin?</Badge>
             </motion.div>
             <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-3xl lg:text-4xl font-bold mb-4">Join the STG Tower Community</motion.h2>
             <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-gray-300 mb-8 max-w-2xl mx-auto">Whether you're a current tenant or looking for your next home, our portal is your gateway to a better rental experience.</motion.p>
             <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true, amount: 0.5 }} 
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
             >
                <Button size="lg" asChild className="group bg-white text-primary hover:bg-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                    <Link href="/login">
                      <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                      Access Tenant Portal <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild className="group">
                  <Link href="/report">Report an Issue</Link>
                </Button>
             </motion.div>
          </div>
        </section>

      </main>

      {/* --- REDESIGNED FOOTER --- */}
      <footer className="w-full py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Column 1: Brand */}
              <div className="md:col-span-1 text-center md:text-left">
                <Link href="/" className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="font-bold text-xl text-white">STG Tower</span>
                </Link>
                <p className="text-sm">Bhotebahal, Kathmandu, Nepal</p>
              </div>

              {/* Column 2: Quick Links */}
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-lg text-white mb-4">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/login" className="hover:text-white transition-colors">Tenant Login</Link></li>
                  <li><Link href="/report" className="hover:text-white transition-colors">Report an Issue</Link></li>
                </ul>
              </div>

              {/* Column 3: Contact */}
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-lg text-white mb-4">Contact Us</h3>
                <div className="space-y-2 text-sm">
                    <a href="tel:9822790665" className="flex items-center justify-center md:justify-start gap-2 hover:text-white transition-colors"><Phone className="h-4 w-4" /> 9822790665</a>
                    <a href="mailto:stgtowerhouse@gmail.com" className="flex items-center justify-center md:justify-start gap-2 hover:text-white transition-colors"><Mail className="h-4 w-4" /> stgtowerhouse@gmail.com</a>
                </div>
              </div>

              {/* Column 4: Social */}
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-lg text-white mb-4">Follow Us</h3>
                <p className="text-sm mb-4">Stay updated with our latest news.</p>
                <div className="flex justify-center md:justify-start gap-4">
                  {/* Add your real social media links here */}
                </div>
              </div>
            </div>
            <Separator className="my-8 bg-gray-700" />
            <div className="text-center text-sm">
                <p>© {new Date().getFullYear()} STG Tower Management. All Rights Reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}