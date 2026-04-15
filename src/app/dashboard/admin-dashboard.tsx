'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';
import Pusher from 'pusher-js';
import { toast } from 'react-hot-toast';
import { useMediaQuery } from 'usehooks-ts';

// --- UI Components & Icons ---
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    Users, FileText, Banknote, AlertCircle, Wrench, Receipt, 
    Scale, TrendingUp, TrendingDown, Inbox, IndianRupee, ArrowRight,
    Sparkles
} from "lucide-react";

// --- Types ---
interface SummaryData {
  totalRentDue: number;
  activeTenants: number;
  unpaidUtilityBills: number;
  lastPayment: {
    amount: number;
    date: string;
  };
}

interface FinancialsData {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
}

// --- Reusable SWR Fetcher & Components ---
const fetcher = (url: string) => fetch(url).then(res => res.json());

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const targetValue = value || 0;
    let animationFrameId: number;
    const update = () => {
      const diff = targetValue - displayValue;
      if (Math.abs(diff) < 1) {
        setDisplayValue(targetValue);
        return;
      }
      setDisplayValue(prev => prev + diff * 0.1);
      animationFrameId = requestAnimationFrame(update);
    };
    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, displayValue]);

  return <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{Math.round(displayValue).toLocaleString('en-IN')}</motion.span>;
};

const StatCardApp = ({ title, value, Icon, description, isCurrency = true, delay, fromColor, badgeClass, iconColor }: { title: string; value: number; Icon: React.ElementType; description?: string; isCurrency?: boolean; delay: number; fromColor: string; badgeClass: string; iconColor: string; }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: "easeOut" }}>
        <Card className="relative overflow-hidden border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(11,40,99,0.08)] transition-all duration-500 rounded-[2.5rem] bg-white/70 backdrop-blur-xl group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${fromColor} to-transparent opacity-40 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700 pointer-events-none -z-10`}></div>
            <CardContent className="p-6 md:p-8 flex flex-col h-full z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center shadow-inner ${badgeClass} text-white`}>
                        <Icon className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                </div>
                <div className="mt-auto">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
                    <div className={`text-3xl md:text-4xl font-black ${iconColor} tracking-tight`}>
                        {isCurrency && <span className="text-xl md:text-2xl mr-1">Rs</span>}
                        <AnimatedNumber value={value} />
                    </div>
                    {description && <p className="text-xs font-semibold text-slate-400 mt-2">{description}</p>}
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

const CinematicFinancialHero = ({ data }: { data: FinancialsData | null }) => {
    const totalIncome = data?.totalIncome || 0;
    const totalExpense = data?.totalExpense || 0;
    const maxVal = Math.max(totalIncome, totalExpense, 1);
    
    // CSS calculated widths for zero-lag bars
    const incomeWidth = `${Math.min((totalIncome / maxVal) * 100, 100)}%`;
    const expenseWidth = `${Math.min((totalExpense / maxVal) * 100, 100)}%`;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <Card className="relative overflow-hidden border border-white/60 shadow-[0_20px_60px_rgba(11,40,99,0.06)] rounded-[2.5rem] bg-white/80 backdrop-blur-3xl group mt-4 mb-16">
                <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent opacity-60 pointer-events-none -z-10 blur-3xl"></div>
                <CardContent className="p-8 md:p-10">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-10 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-5 w-5 text-blue-500" />
                                <h2 className="text-sm md:text-base font-black uppercase text-slate-400 tracking-widest">Financial Overview</h2>
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black text-[#0B2863] tracking-tighter">
                                Rs <AnimatedNumber value={data?.netProfit ?? 0} />
                            </h3>
                            <p className="text-sm font-bold text-emerald-500 mt-2 tracking-wide">NET PROFIT GENERATED</p>
                        </div>
                        <Button asChild variant="outline" className="hidden sm:flex rounded-full bg-white/50 border-slate-200/50 hover:bg-white hover:border-[#0B2863] transition-all font-bold text-[#0B2863] shadow-sm"><Link href="/dashboard/financials">Full Report</Link></Button>
                    </div>

                    <div className="space-y-6">
                        {/* Income Bar */}
                        <div className="group/bar">
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-emerald-700 flex items-center gap-2"><TrendingUp className="h-4 w-4"/> Total Income</span>
                                <span className="text-emerald-900 tracking-tight text-base">Rs {(data?.totalIncome || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                                <motion.div initial={{ width: "0%" }} whileInView={{ width: incomeWidth }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full group-hover/bar:brightness-110 transition-all"></motion.div>
                            </div>
                        </div>

                        {/* Expense Bar */}
                        <div className="group/bar">
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-rose-600 flex items-center gap-2"><TrendingDown className="h-4 w-4"/> Total Expenses</span>
                                <span className="text-rose-900 tracking-tight text-base">Rs {(data?.totalExpense || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                                <motion.div initial={{ width: "0%" }} whileInView={{ width: expenseWidth }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} className="absolute left-0 top-0 h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full group-hover/bar:brightness-110 transition-all"></motion.div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// iOS App Quick Actions Grid
const QuickActionsAppGrid = () => {
    const actions = [
        { title: "Tenants", icon: Users, href: "/dashboard/tenants", color: "text-indigo-600", bg: "bg-indigo-50", fill: "bg-indigo-500" },
        { title: "Finances", icon: Scale, href: "/dashboard/financials", color: "text-emerald-600", bg: "bg-emerald-50", fill: "bg-emerald-500" },
        { title: "Rent Bill", icon: Receipt, href: "/dashboard/rent-bills", color: "text-blue-600", bg: "bg-blue-50", fill: "bg-[#0B2863]" },
        { title: "Utility Bill", icon: FileText, href: "/dashboard/utility-bills", color: "text-amber-600", bg: "bg-amber-50", fill: "bg-amber-500" },
        { title: "Repair", icon: Wrench, href: "/dashboard/maintenance", color: "text-rose-600", bg: "bg-rose-50", fill: "bg-rose-500" },
    ];

    return (
        <div className="mb-8">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Quick Apps</h2>
            {/* Horizontal scroll on mobile, grid on desktop - ZERO LAG */}
            <div className="flex overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-5 gap-3 md:gap-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
                {actions.map((act, i) => (
                    <motion.div key={i} initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} transition={{delay: i*0.05 + 0.2}} className="snap-start shrink-0">
                        <Link href={act.href} className="flex flex-col items-center justify-center gap-3 w-[105px] h-[115px] md:w-auto md:h-[130px] rounded-[2rem] bg-white/80 backdrop-blur-md border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(11,40,99,0.08)] hover:-translate-y-1 transition-all active:scale-95 group overflow-hidden relative">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] flex items-center justify-center bg-white shadow-[0_2px_15px_rgba(0,0,0,0.04)] group-hover:shadow-[0_5px_20px_rgba(11,40,99,0.1)] transition-all z-10 group-hover:-translate-y-1">
                                <act.icon className={`w-7 h-7 md:w-8 md:h-8 ${act.color}`} strokeWidth={2.5} />
                            </div>
                            <span className="text-xs md:text-sm font-bold text-slate-600 group-hover:text-slate-900 z-10 transition-colors">{act.title}</span>
                            <div className={`absolute bottom-0 left-0 w-full h-1 ${act.fill} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---
export function AdminDashboard() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: summaryResponse, error: summaryError } = useSWR('/api/dashboard/summary', fetcher);
  const { data: financialsResponse, error: financialsError } = useSWR('/api/financials/summary', fetcher);
  const { data: submissionsResponse, mutate: mutateSubmissions } = useSWR('/api/submissions', fetcher);
  
  const summaryData: SummaryData | null = summaryResponse?.data ?? null;
  const financialsData: FinancialsData | null = financialsResponse?.data ?? null;
  const unreadCount = submissionsResponse?.data?.unreadCount ?? 0;
  
  const todayBS = new NepaliDate().format('ddd, MMMM DD, YYYY', 'np');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return;
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusherClient.subscribe('admin-notifications');
    channel.bind('new-submission', (data: { subject: string, name: string }) => {
      toast.success(`New Message: "${data.subject}" from ${data.name}`);
      mutateSubmissions();
    });
    return () => {
      pusherClient.unsubscribe('admin-notifications');
      pusherClient.disconnect();
    };
  }, [mutateSubmissions]);

  const isLoading = !summaryResponse || !financialsResponse;
  const error = summaryError || financialsError;

  if (isLoading) {
    return (
      <div className="space-y-8 p-4 md:p-8 bg-[#F8FAFC] min-h-screen">
        <div className="flex items-center justify-between"><Skeleton className="h-10 w-64 rounded-xl" /><Skeleton className="h-12 w-12 rounded-full" /></div>
        <div className="grid gap-4 md:grid-cols-5"><Skeleton className="h-[115px] rounded-[2rem]" /><Skeleton className="h-[115px] rounded-[2rem]" /><Skeleton className="h-[115px] rounded-[2rem]" /><Skeleton className="h-[115px] rounded-[2rem]" /><Skeleton className="h-[115px] rounded-[2rem]" /></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-44 rounded-[2.5rem]" /><Skeleton className="h-44 rounded-[2.5rem]" /><Skeleton className="h-44 rounded-[2.5rem]" /><Skeleton className="h-44 rounded-[2.5rem]" /></div>
        <Skeleton className="h-80 rounded-[2.5rem]" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 bg-[#F8FAFC] min-h-screen"><Alert variant="destructive" className="bg-red-50 border-red-200"><AlertCircle className="h-4 w-4" /><AlertTitle>System Alert</AlertTitle><AlertDescription>Secure connection to terminal failed. Please reconnect.</AlertDescription></Alert></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-32 overflow-hidden relative selection:bg-[#0B2863]/20">
      {/* Background Ambient Blooms */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none"></div>
      
      {/* Cinematic Greeting Hero */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex py-2 justify-between items-end mb-10 mt-2 z-10 relative">
        <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter mb-2">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B2863] to-blue-600">Admin</span>.
            </h1>
            <p className="text-sm md:text-base font-bold text-slate-400 tracking-wide uppercase">{todayBS}</p>
        </div>
        <Button asChild variant="outline" className="relative rounded-full h-12 w-12 p-0 bg-white/80 backdrop-blur-md border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-95 group z-20">
            <Link href="/dashboard/inbox">
                <Inbox className="h-5 w-5 text-slate-600 group-hover:text-[#0B2863] transition-colors" />
                {unreadCount > 0 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{unreadCount}</span>
                    </motion.div>
                )}
            </Link>
        </Button>
      </motion.div>

      {/* App Tier Quick Integrations Grid */}
      <div className="relative z-10 w-full overflow-hidden">
        <QuickActionsAppGrid />
      </div>

      {/* Primary Metrics Layer */}
      <div className="mb-4 px-1"><h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Live Metrics</h2></div>
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 relative z-10">
        <StatCardApp 
            title="Total Rent Due" value={summaryData?.totalRentDue ?? 0} Icon={IndianRupee} delay={0.1}
            fromColor="from-blue-400" badgeClass="bg-blue-500 shadow-[0_5px_15px_rgba(59,130,246,0.3)]" iconColor="text-[#0B2863]"
        />
        <StatCardApp 
            title="Active Tenants" value={summaryData?.activeTenants ?? 0} Icon={Users} isCurrency={false} delay={0.2}
            fromColor="from-indigo-400" badgeClass="bg-indigo-500 shadow-[0_5px_15px_rgba(99,102,241,0.3)]" iconColor="text-indigo-900"
        />
        <StatCardApp 
            title="Unpaid Utility" value={summaryData?.unpaidUtilityBills ?? 0} Icon={FileText} isCurrency={false} delay={0.3}
            fromColor="from-amber-400" badgeClass="bg-amber-500 shadow-[0_5px_15px_rgba(245,158,11,0.3)]" iconColor="text-amber-900"
        />
        <StatCardApp 
            title="Last Payment" value={summaryData?.lastPayment?.amount ?? 0} Icon={Banknote} delay={0.4}
            description={`Received On ${new Date(summaryData?.lastPayment?.date ?? '').toLocaleDateString()}`}
            fromColor="from-emerald-400" badgeClass="bg-emerald-500 shadow-[0_5px_15px_rgba(16,185,129,0.3)]" iconColor="text-emerald-900"
        />
      </div>

      {/* Mega Visualizer Component */}
      <div className="relative z-10 w-full">
        <CinematicFinancialHero data={financialsData} />
      </div>

    </div>
  );
}