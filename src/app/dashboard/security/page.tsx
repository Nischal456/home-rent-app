'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';
import { toast, Toaster } from 'sonner'; // Ultra-premium toast system
import Pusher from 'pusher-js';

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// --- Icons ---
import {
    Loader2, Droplets, Wrench, Wallet, PlusCircle, TrendingDown, TrendingUp,
    ShieldCheck, CheckCircle2, PlayCircle, Calendar, LayoutList, MapPin,
    AlignLeft, Circle, Info, Banknote, ListX, BellRing, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Fetcher & Helpers ---
const fetcher = (url: string) => fetch(url).then(res => res.json());

// ✅ RESTORED: formatDateTime to fix TypeScript errors
const formatDateTime = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    const dateObj = new Date(dateString);
    const nepaliDate = new NepaliDate(dateObj).format('YYYY MMMM DD');
    const time = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${nepaliDate}, ${time}`;
};

// --- Authentic Nepali Date Helper ---
const getNepaliDateText = () => {
    const nd = new NepaliDate();
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    const months = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'];
    const days = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];

    const convertToNepaliNum = (num: number) => num.toString().split('').map(d => nepaliDigits[parseInt(d)] || d).join('');

    return `${convertToNepaliNum(nd.getYear())} ${months[nd.getMonth()]} ${convertToNepaliNum(nd.getDate())}, ${days[nd.getDay()]}`;
};

export default function SecurityDashboard() {
    const { data: apiData, isLoading, mutate } = useSWR('/api/security/dashboard', fetcher, {
        revalidateOnFocus: true, // Keep it ultra-fresh
    });

    // UI State
    const [isWaterDialogOpen, setIsWaterDialogOpen] = useState(false);
    const [selectedFinance, setSelectedFinance] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [waterCost, setWaterCost] = useState('');
    const [waterVol, setWaterVol] = useState('');

    // Task Department State
    const [taskTab, setTaskTab] = useState<'Active' | 'Done'>('Active');
    const [selectedTask, setSelectedTask] = useState<any>(null);

    // Tab & Unread Badge State
    const [activeTab, setActiveTab] = useState('tasks');
    const activeTabRef = useRef(activeTab);
    const [unreadTasks, setUnreadTasks] = useState(false);
    const [unreadFixes, setUnreadFixes] = useState(false);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        activeTabRef.current = val;
        if (val === 'tasks') setUnreadTasks(false);
        if (val === 'issues') setUnreadFixes(false);
    };

    // Live Clock State
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState(new Date());

    const todayBS = new NepaliDate().format('YYYY-MM-DD');
    const nepaliDateStr = getNepaliDateText();

    // --- Live Clock & Mount Effect ---
    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- Real-time Notifications (Pusher) ---
    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return;
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
        const channel = pusher.subscribe('security-channel');

        channel.bind('payment-received', (data: any) => {
            toast.success(data.message || "New Payment Received!", { icon: '💰', duration: 4000 });
            mutate();
        });

        channel.bind('new-task', (data: any) => {
            toast.info(`New Assignment: ${data.message}`, { icon: <BellRing className="w-4 h-4 text-blue-500 animate-bounce" />, duration: 5000 });
            if (activeTabRef.current !== 'tasks') setUnreadTasks(true);
            mutate();
        });

        channel.bind('new-maintenance', (data: any) => {
            toast.info(`Maintenance Alert: ${data.message}`, { icon: <Wrench className="w-4 h-4 text-orange-500 animate-bounce" />, duration: 5000 });
            if (activeTabRef.current !== 'issues') setUnreadFixes(true);
            mutate();
        });

        return () => { pusher.unsubscribe('security-channel'); };
    }, [mutate]);

    // --- API Handlers ---
    const handleAddWater = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!waterCost || !waterVol) return toast.error("Please fill all fields.");
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/security/dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cost: Number(waterCost), volumeLiters: Number(waterVol) })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Water Tanker Logged!", { icon: '💧' });
            setIsWaterDialogOpen(false);
            setWaterCost(''); setWaterVol('');
            mutate();
        } catch (e) {
            toast.error("Failed to log water tanker.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string, isTask = false) => {
        const toastId = toast.loading("Updating status...");
        try {
            const endpoint = isTask ? `/api/admin/security/tasks/${id}` : `/api/maintenance/${id}`;
            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error("Failed");

            toast.success(newStatus === 'COMPLETED' ? "Marked as Done! 🎉" : "Status Updated!", { id: toastId });
            setSelectedTask(null);
            mutate();
        } catch (e) {
            toast.error("Update failed.", { id: toastId });
        }
    };

    // --- Loading State (Skeleton) ---
    if (isLoading) {
        return (
            <div className="min-h-[100dvh] bg-[#f8fafc] p-4 md:p-8 space-y-6 max-w-7xl mx-auto flex flex-col">
                <Skeleton className="h-48 md:h-64 w-full rounded-[2.5rem]" />
                <div className="flex overflow-x-auto gap-3 pb-2">
                    <Skeleton className="h-12 w-28 shrink-0 rounded-2xl" />
                    <Skeleton className="h-12 w-28 shrink-0 rounded-2xl" />
                    <Skeleton className="h-12 w-28 shrink-0 rounded-2xl" />
                </div>
                <Skeleton className="h-[50vh] w-full rounded-[2.5rem]" />
            </div>
        );
    }

    // --- Data Extraction & Logic ---
    const { recentWater = [], finances = [], activeMaintenance = [], tasks = [], netBalance = 0 } = apiData?.data || {};

    const activeTasks = tasks.filter((t: any) => t.status !== 'COMPLETED');
    const doneTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
    const displayTasks = taskTab === 'Active' ? activeTasks : doneTasks;

    // Red dot logic for Fixes tab
    const hasPendingFixes = activeMaintenance.some((m: any) => m.status === 'PENDING');

    return (
        <div className="min-h-[100dvh] bg-[#f8fafc] pb-32 font-sans selection:bg-[#0B2863] selection:text-white">

            {/* Premium Sonner Toaster */}
            <Toaster position="top-center" richColors theme="light" toastOptions={{ style: { borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -5px rgb(0 0 0 / 0.1)' } }} />

            {/* --- Premium Mobile-First Header --- */}
            <header className="bg-gradient-to-br from-[#0B2863] to-blue-800 text-white p-5 md:p-10 pb-16 md:pb-24 rounded-b-[2.5rem] md:rounded-b-[3rem] shadow-[0_10px_40px_-10px_rgba(11,40,99,0.5)] relative overflow-hidden transform-gpu">
                {/* Performance optimized background glows - Hidden on small mobile to ensure 0 lag */}
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[80px] pointer-events-none hidden sm:block transform-gpu will-change-transform"></div>

                <div className="flex flex-col relative z-10 max-w-[1600px] mx-auto">

                    {/* Unified Left-Aligned Date & Live Clock */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-5 md:mb-6">
                        {/* Live Clock with Seconds */}
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide shadow-sm text-emerald-50">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span className="tabular-nums font-mono text-sm tracking-tighter">
                                {mounted ? time.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' }) : '--:--:-- --'}
                            </span>
                        </motion.div>

                        {/* Authentic Nepali Date */}
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide shadow-sm text-blue-50">
                            <Calendar className="w-4 h-4 text-blue-300" />
                            {nepaliDateStr}
                        </motion.div>
                    </div>

                    <h2 className="text-xl md:text-2xl font-semibold text-blue-100 tracking-tight">Hi, Suman 👋</h2>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-sm mt-1">
                        User Portal
                    </h1>
                </div>
            </header>

            <main className="px-3 md:px-8 -mt-8 md:-mt-16 space-y-5 md:space-y-6 max-w-[1600px] mx-auto relative z-20">

                {/* --- Accurate Net Balance Card --- */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Card className="border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.06)] bg-white/90 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-5 md:p-8 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Net Payable Balance</p>
                                <h3 className={cn(
                                    "text-3xl md:text-5xl font-black tracking-tight drop-shadow-sm",
                                    netBalance < 0 ? "text-red-500" : "text-[#0B2863]"
                                )}>
                                    Rs {Math.abs(netBalance).toLocaleString('en-IN')}
                                </h3>
                                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold bg-slate-50 px-2.5 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                    {netBalance < 0 ? (
                                        <><TrendingDown className="w-3.5 h-3.5 text-red-500" /> <span className="text-slate-600">Advance exceeds salary</span></>
                                    ) : (
                                        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-slate-600">Current settled amount</span></>
                                    )}
                                </div>
                            </div>
                            <div className="hidden sm:flex bg-blue-50/50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-blue-100 shadow-inner">
                                <Wallet className="text-blue-600 w-10 h-10 md:w-12 md:h-12" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* --- Scrollable Mobile Navigation Tabs --- */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    {/* `no-scrollbar` hides the bar but keeps it horizontally scrollable on mobile */}
                    <div className="w-full overflow-x-auto styled-scrollbar pb-2 md:pb-0">
                        <TabsList className="flex md:grid md:grid-cols-4 w-max md:w-full gap-2 md:gap-0 mb-4 md:mb-6 h-14 md:h-16 bg-transparent md:bg-white md:shadow-[0_4px_20px_rgb(0,0,0,0.03)] md:border border-slate-100 rounded-2xl md:rounded-[1.5rem] md:p-1.5">

                            <TabsTrigger value="tasks" className="shrink-0 px-4 md:px-0 h-full rounded-xl font-bold text-xs md:text-sm data-[state=active]:bg-[#0B2863] data-[state=active]:text-white transition-all bg-white shadow-sm border border-slate-100 md:border-none relative">
                                <LayoutList className="w-4 h-4 mr-2" /> Tasks
                                {unreadTasks && (
                                    <span className="absolute top-1.5 right-1.5 md:top-2 md:right-3 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                                    </span>
                                )}
                            </TabsTrigger>

                            <TabsTrigger value="finance" className="shrink-0 px-4 md:px-0 h-full rounded-xl font-bold text-xs md:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all bg-white shadow-sm border border-slate-100 md:border-none">
                                <Wallet className="w-4 h-4 mr-2" /> Wallet
                            </TabsTrigger>

                            {/* FIXES TAB with Dynamic Red Dot Notification */}
                            <TabsTrigger value="issues" className="shrink-0 px-4 md:px-0 h-full rounded-xl font-bold text-xs md:text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all bg-white shadow-sm border border-slate-100 md:border-none relative">
                                <Wrench className="w-4 h-4 mr-2" /> Fixes
                                {(hasPendingFixes || unreadFixes) && (
                                    <span className="absolute top-1.5 right-1.5 md:top-2 md:right-3 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                                    </span>
                                )}
                            </TabsTrigger>

                            <TabsTrigger value="water" className="shrink-0 px-4 md:px-0 h-full rounded-xl font-bold text-xs md:text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 transition-all bg-white shadow-sm border border-slate-100 md:border-none">
                                <Droplets className="w-4 h-4 mr-2" /> Water
                            </TabsTrigger>

                        </TabsList>
                    </div>

                    {/* =========================================
                        TAB 1: TASKS DEPARTMENT
                    ============================================= */}
                    <TabsContent value="tasks" className="animate-in fade-in zoom-in-[0.98] duration-300 outline-none">
                        <Card className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.06)] rounded-[2rem] md:rounded-[2.5rem] flex flex-col min-h-[450px] overflow-hidden">
                            <CardHeader className="bg-white/50 border-b border-slate-100 p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#0B2863]/10 text-[#0B2863] rounded-xl shadow-inner"><LayoutList className="w-6 h-6" /></div>
                                    <div>
                                        <CardTitle className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Tasks Dept</CardTitle>
                                        <CardDescription className="font-bold text-slate-500 text-xs md:text-sm">Assigned operations.</CardDescription>
                                    </div>
                                </div>

                                {/* Active / Done Toggle */}
                                <div className="flex items-center p-1 bg-slate-100/80 rounded-[1rem] border border-slate-200/50 shadow-inner w-full md:w-auto">
                                    <button onClick={() => setTaskTab('Active')} className={cn("flex-1 md:w-28 px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all duration-300", taskTab === 'Active' ? "bg-white text-[#0B2863] shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700")}>
                                        Active ({activeTasks.length})
                                    </button>
                                    <button onClick={() => setTaskTab('Done')} className={cn("flex-1 md:w-28 px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all duration-300", taskTab === 'Done' ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700")}>
                                        Done ({doneTasks.length})
                                    </button>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto styled-scrollbar p-4 md:p-6 bg-[#f8fafc]/50">
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {displayTasks.length === 0 ? (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12 md:py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                                                {taskTab === 'Active' ? <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300 mb-3" /> : <ListX className="mx-auto h-12 w-12 text-slate-300 mb-3" />}
                                                <h3 className="text-lg md:text-xl font-black text-slate-700 tracking-tight">{taskTab === 'Active' ? "All Caught Up!" : "No Completed Tasks"}</h3>
                                                <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">{taskTab === 'Active' ? "No pending assignments." : "Completed tasks will appear here."}</p>
                                            </motion.div>
                                        ) : (
                                            displayTasks.map((task: any) => {
                                                const isCompleted = task.status === 'COMPLETED';
                                                const isToday = task.dateBS === todayBS;
                                                let priorityColor = "bg-blue-400";
                                                if (task.priority === 'URGENT') priorityColor = "bg-red-500";
                                                if (task.priority === 'HIGH') priorityColor = "bg-orange-500";

                                                return (
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95, x: taskTab === 'Active' ? 50 : -50 }}
                                                        transition={{ duration: 0.2 }}
                                                        key={task._id}
                                                        onClick={() => setSelectedTask(task)}
                                                        className={cn(
                                                            "group relative flex items-center justify-between p-4 rounded-2xl shadow-sm border transition-all cursor-pointer transform-gpu active:scale-[0.98]",
                                                            isCompleted ? "bg-emerald-50/30 border-emerald-100/60" : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-md"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 md:gap-4 w-full pr-2">
                                                            <div className={cn("w-1.5 h-10 md:h-12 rounded-full shrink-0", isCompleted ? "bg-emerald-400" : priorityColor)} />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {isToday && !isCompleted && <span className="bg-red-50 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse border border-red-100 shrink-0">Today</span>}
                                                                    <span className={cn("text-[9px] md:text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0", isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                                                                        {task.dateBS}
                                                                    </span>
                                                                </div>
                                                                <h4 className={cn("font-black text-sm md:text-base truncate tracking-tight", isCompleted ? "line-through text-slate-500" : "text-slate-900")}>
                                                                    {task.title}
                                                                </h4>
                                                            </div>
                                                        </div>

                                                        {/* Status Icon */}
                                                        <div className="shrink-0 pl-2">
                                                            {!isCompleted && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task._id, 'COMPLETED', true); }} className="p-1.5 rounded-full hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-colors">
                                                                    <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />
                                                                </button>
                                                            )}
                                                            {isCompleted && <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-400" />}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* =========================================
                        TAB 2: TENANT MAINTENANCE (FIXES)
                    ============================================= */}
                    <TabsContent value="issues" className="animate-in fade-in zoom-in-[0.98] duration-300 outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeMaintenance.length === 0 ? (
                                <div className="col-span-full text-center py-16 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm">
                                    <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-300 mb-3" />
                                    <h3 className="text-xl font-black text-slate-700 tracking-tight">No Fixes Needed!</h3>
                                    <p className="text-slate-500 text-sm font-medium mt-1">All maintenance requests are resolved.</p>
                                </div>
                            ) : (
                                activeMaintenance.map((task: any, idx: number) => (
                                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={task._id} className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <h4 className="font-black text-slate-900 text-base leading-tight break-words">{task.issue}</h4>
                                            <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0", task.status === 'PENDING' ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-blue-50 text-blue-700 border-blue-200")}>{task.status}</Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl mb-5 border border-slate-100">
                                            <span className="bg-white px-2 py-1 rounded-lg shadow-sm text-[#0B2863] border border-slate-100 flex items-center gap-1"><MapPin className="w-3 h-3" /> Flat {task.roomId?.roomNumber}</span>
                                            <span className="flex items-center gap-1"><Circle className="w-1.5 h-1.5 fill-slate-300 text-slate-300" /> {task.tenantId?.fullName}</span>
                                        </div>
                                        <div className="flex gap-2 mt-auto">
                                            {task.status === 'PENDING' && (
                                                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xs h-10 shadow-sm transform-gpu active:scale-95 transition-all" onClick={() => handleUpdateStatus(task._id, 'IN_PROGRESS')}>
                                                    <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Start
                                                </Button>
                                            )}
                                            <Button size="sm" className={cn(
                                                "flex-[1.5] rounded-xl font-bold text-xs h-10 shadow-sm transform-gpu active:scale-95 transition-all",
                                                task.status === 'PENDING' ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-green-500 hover:to-emerald-400 text-white'
                                            )} onClick={() => handleUpdateStatus(task._id, 'COMPLETED')}>
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark Done
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* =========================================
                        TAB 3: WATER LOGGING
                    ============================================= */}
                    <TabsContent value="water" className="animate-in fade-in zoom-in-[0.98] duration-300 outline-none">
                        <div className="space-y-5">
                            <Button onClick={() => setIsWaterDialogOpen(true)} className="w-full bg-gradient-to-r from-[#0B2863] to-blue-700 hover:from-blue-700 hover:to-[#0B2863] h-14 md:h-16 rounded-2xl md:rounded-[2rem] text-base md:text-lg font-black shadow-lg shadow-blue-900/20 transform-gpu active:scale-[0.98] transition-all">
                                <PlusCircle className="w-5 h-5 mr-2 text-blue-200" /> Log Water Tanker
                            </Button>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {recentWater.length === 0 ? (
                                    <div className="col-span-full text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200"><Droplets className="mx-auto h-10 w-10 text-slate-300 mb-2" /><p className="font-bold text-sm text-slate-500">No recent logs.</p></div>
                                ) : (
                                    recentWater.map((log: any, idx: number) => (
                                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={log._id} className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-3.5">
                                                <div className="bg-blue-50 text-blue-500 p-3 rounded-xl shadow-inner"><Droplets className="w-5 h-5 md:w-6 md:h-6" /></div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm md:text-base">{log.volumeLiters} Liters</p>
                                                    <p className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">{formatDateTime(log.entryDate)}</p>
                                                </div>
                                            </div>
                                            <span className="font-black text-[#0B2863] text-base md:text-lg">Rs {log.cost.toLocaleString()}</span>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* =========================================
                        TAB 4: WALLET / FINANCE
                    ============================================= */}
                    <TabsContent value="finance" className="animate-in fade-in zoom-in-[0.98] duration-300 outline-none">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {finances.length === 0 ? (
                                <div className="col-span-full text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm"><Wallet className="mx-auto h-12 w-12 text-slate-300 mb-3" /><p className="font-black text-slate-700 text-lg tracking-tight">No Transactions</p></div>
                            ) : (
                                finances.map((record: any, idx: number) => {
                                    const isAdvance = record.type === 'ADVANCE';
                                    return (
                                        <React.Fragment key={record._id}>
                                            <motion.div 
                                                initial={{ opacity: 0, y: 15 }} 
                                                animate={{ opacity: 1, y: 0 }} 
                                                transition={{ delay: idx * 0.05 }} 
                                                onClick={() => setSelectedFinance(record)}
                                                className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.98] transform-gpu"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("p-3 rounded-xl shadow-inner shrink-0", isAdvance ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600')}>
                                                        {isAdvance ? <TrendingDown className="w-5 h-5" strokeWidth={2.5} /> : <TrendingUp className="w-5 h-5" strokeWidth={2.5} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm md:text-base tracking-tight">{record.type === 'SALARY' ? `Salary: ${record.month}` : record.type}</p>
                                                        <p className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">{formatDateTime(record.date)}</p>
                                                    </div>
                                                </div>
                                                <span className={cn("font-black text-base md:text-lg", isAdvance ? 'text-orange-600' : 'text-emerald-600')}>
                                                    {isAdvance ? '-' : '+'}Rs {record.amount.toLocaleString()}
                                                </span>
                                            </motion.div>
                                            
                                            {/* --- Premium Full-Width Dashed Cycle Separator --- */}
                                            {record.type === 'SALARY' && (
                                                <div className="col-span-1 sm:col-span-2 py-3 px-1 flex items-center gap-4 opacity-80">
                                                    <div className="flex-1 h-px border-t-2 border-dashed border-slate-300"></div>
                                                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase rounded-full bg-slate-100/50 px-3 py-1 text-center shadow-sm border border-slate-200">
                                                        Start of New Billing Cycle
                                                    </span>
                                                    <div className="flex-1 h-px border-t-2 border-dashed border-slate-300"></div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* =========================================
                PREMIUM TASK DETAILS MODAL
            ============================================= */}
            <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
                <DialogContent className="w-[95vw] sm:max-w-md rounded-[2rem] p-0 border-0 shadow-2xl bg-white overflow-hidden [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Task Details</DialogTitle>
                        <DialogDescription>View details and update task status.</DialogDescription>
                    </DialogHeader>

                    {selectedTask && (
                        <div className="flex flex-col max-h-[85vh]">
                            <div className="relative p-5 md:p-6 bg-[#f8fafc] border-b border-slate-100 shrink-0">
                                <div className={cn("absolute top-0 left-0 w-full h-1.5", selectedTask.status === 'COMPLETED' ? "bg-emerald-500" : "bg-blue-500")}></div>
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="outline" className={cn("font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md", selectedTask.priority === 'URGENT' ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200")}>
                                        {selectedTask.priority}
                                    </Badge>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">{selectedTask.dateBS}</span>
                                </div>
                                <h2 className={cn("text-xl md:text-2xl font-black tracking-tight leading-tight", selectedTask.status === 'COMPLETED' ? "text-slate-500 line-through" : "text-[#0B2863]")}>
                                    {selectedTask.title}
                                </h2>
                            </div>

                            <div className="p-5 md:p-6 space-y-5 overflow-y-auto styled-scrollbar">
                                {selectedTask.location && (
                                    <div>
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Area</p>
                                        <div className="font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
                                            {selectedTask.location}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" /> Instructions</p>
                                    <div className="font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed min-h-[80px]">
                                        {selectedTask.description || <span className="text-slate-400 italic">No additional instructions.</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 md:p-6 pt-0 flex gap-3 shrink-0 mt-auto">
                                <Button variant="outline" onClick={() => setSelectedTask(null)} className="flex-1 h-12 rounded-xl font-bold text-slate-600 border-slate-200">
                                    Close
                                </Button>

                                {selectedTask.status === 'PENDING' && (
                                    <Button onClick={() => handleUpdateStatus(selectedTask._id, 'IN_PROGRESS', true)} className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-extrabold text-white shadow-md shadow-blue-500/20 transform-gpu active:scale-95 transition-all text-sm">
                                        <PlayCircle className="mr-1.5 w-4 h-4" /> Start
                                    </Button>
                                )}
                                {selectedTask.status === 'IN_PROGRESS' && (
                                    <Button onClick={() => handleUpdateStatus(selectedTask._id, 'COMPLETED', true)} className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-green-500 font-extrabold text-white shadow-md transform-gpu active:scale-95 transition-all text-sm">
                                        <CheckCircle2 className="mr-1.5 w-4 h-4" /> Finish
                                    </Button>
                                )}
                                {selectedTask.status === 'COMPLETED' && (
                                    <Button disabled className="flex-[2] h-12 rounded-xl bg-emerald-50 text-emerald-600 font-extrabold text-sm opacity-100 border border-emerald-100">
                                        <CheckCircle2 className="mr-1.5 w-4 h-4" /> Done
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* =========================================
                PREMIUM WATER LOGGING DIALOG
            ============================================= */}
            <Dialog open={isWaterDialogOpen} onOpenChange={setIsWaterDialogOpen}>
                <DialogContent className="w-[90vw] sm:max-w-sm rounded-[2rem] p-0 border-0 shadow-2xl bg-white overflow-hidden [&>button]:hidden">
                    <DialogHeader className="sr-only"><DialogTitle>Log</DialogTitle><DialogDescription>Record</DialogDescription></DialogHeader>

                    <div className="relative p-6 bg-[#f8fafc] border-b border-slate-100 text-center shrink-0">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                        <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-3 shadow-inner">
                            <Droplets className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Log Water</h2>
                    </div>

                    <form onSubmit={handleAddWater} className="p-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Volume (Liters)</label>
                            <Input type="number" required placeholder="5000" className="rounded-xl h-12 font-bold bg-[#f8fafc] border-slate-200 focus:ring-2 focus:ring-blue-500/20" value={waterVol} onChange={(e) => setWaterVol(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Cost (Rs)</label>
                            <Input type="number" required placeholder="2500" className="rounded-xl h-12 font-bold bg-[#f8fafc] border-slate-200 focus:ring-2 focus:ring-blue-500/20" value={waterCost} onChange={(e) => setWaterCost(e.target.value)} />
                        </div>
                        <div className="pt-2 flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsWaterDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-600">Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-[2] h-12 rounded-xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md transform-gpu active:scale-95 transition-all">
                                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirm'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* =========================================
                PREMIUM FINANCE DETAILS MODAL
            ============================================= */}
            <Dialog open={!!selectedFinance} onOpenChange={() => setSelectedFinance(null)}>
                <DialogContent className="w-[90vw] sm:max-w-sm rounded-[2rem] p-0 border-0 shadow-2xl bg-white overflow-hidden [&>button]:hidden">
                     <DialogHeader className="sr-only"><DialogTitle>Finance Details</DialogTitle><DialogDescription>View transaction remarks and info</DialogDescription></DialogHeader>
                     
                     {selectedFinance && (() => {
                         const isAdvance = selectedFinance.type === 'ADVANCE';
                         return (
                            <div className="flex flex-col">
                                <div className="relative p-6 pt-8 bg-[#f8fafc] border-b border-slate-100 shrink-0 text-center">
                                    <div className={cn("absolute top-0 left-0 w-full h-1.5", isAdvance ? "bg-orange-400" : "bg-emerald-500")}></div>
                                    
                                    <Badge variant="outline" className={cn("absolute top-4 right-4 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md", isAdvance ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")}>
                                        {selectedFinance.type}
                                    </Badge>

                                    <div className="flex justify-center mb-4">
                                        <div className={cn("p-4 rounded-full shadow-inner", isAdvance ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600")}>
                                            {isAdvance ? <TrendingDown className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight text-slate-900 drop-shadow-sm">Rs {selectedFinance.amount.toLocaleString()}</h2>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-2">{formatDateTime(selectedFinance.date)}</p>
                                </div>

                                <div className="p-6 space-y-5 bg-white">
                                    {selectedFinance.month && (
                                        <div>
                                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Billing Month</p>
                                            <div className="font-bold text-[#0B2863] bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-sm">
                                                {selectedFinance.month}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" /> Notes / Remarks</p>
                                        <div className="font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed min-h-[80px]">
                                            {selectedFinance.remarks || <span className="text-slate-400 italic font-normal">No additional notes provided for this transaction.</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 pt-0 mt-2 flex">
                                    <Button onClick={() => setSelectedFinance(null)} className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold transition-all active:scale-95">
                                        Close Details
                                    </Button>
                                </div>
                            </div>
                         );
                     })()}
                </DialogContent>
            </Dialog>

            {/* Custom CSS to hide scrollbar but allow touch scrolling */}
            <style jsx global>{`
                .styled-scrollbar::-webkit-scrollbar { display: none; }
                .styled-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}