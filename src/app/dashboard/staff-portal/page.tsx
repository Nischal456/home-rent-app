'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';
import { toast, Toaster } from 'sonner';
import Pusher from 'pusher-js';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import {
    Loader2, Wallet, TrendingDown, TrendingUp, CheckCircle2, PlayCircle, Calendar,
    LayoutList, MapPin, AlignLeft, Circle, Banknote, ListX, BellRing, Clock,
    Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const formatDateTime = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    const dateObj = new Date(dateString);
    const nepaliDate = new NepaliDate(dateObj).format('YYYY MMMM DD');
    const time = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${nepaliDate}, ${time}`;
};

const getNepaliDateText = () => {
    const nd = new NepaliDate();
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    const months = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'];
    const days = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];

    const convertToNepaliNum = (num: number) => num.toString().split('').map(d => nepaliDigits[parseInt(d)] || d).join('');
    return `${convertToNepaliNum(nd.getYear())} ${months[nd.getMonth()]} ${convertToNepaliNum(nd.getDate())}, ${days[nd.getDay()]}`;
};

export default function StaffPortalDashboard() {
    const { data: apiData, isLoading, mutate } = useSWR('/api/staff-portal', fetcher, { revalidateOnFocus: true });

    const [taskTab, setTaskTab] = useState<'Active' | 'Done'>('Active');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('tasks');
    const activeTabRef = useRef(activeTab);
    const [unreadTasks, setUnreadTasks] = useState(false);

    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState(new Date());

    const todayBS = new NepaliDate().format('YYYY-MM-DD');
    const nepaliDateStr = getNepaliDateText();

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const userId = apiData?.data?.userId;
        if (!userId || !process.env.NEXT_PUBLIC_PUSHER_KEY) return;
        
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
        const channelName = `staff-channel-${userId}`;
        const channel = pusher.subscribe(channelName);

        channel.bind('payment-received', (data: any) => {
            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-black text-emerald-700 text-lg">💰 Salary Disbursed!</span>
                    <span className="text-emerald-600 font-semibold text-sm">Amount: Rs {Number(data.amount).toLocaleString()}</span>
                    <span className="text-emerald-500 font-medium text-xs">For Month: {data.month}</span>
                    {data.remarks && <span className="text-slate-500 italic mt-1 text-xs">Note: {data.remarks}</span>}
                </div>, 
                { duration: 6000, style: { background: '#f0fdf4', border: '1px solid #bbf7d0' } }
            );
            mutate();
        });

        channel.bind('new-task', (data: any) => {
            toast.info(`New Assignment: ${data.message}`, { icon: <BellRing className="w-4 h-4 text-blue-500 animate-bounce" />, duration: 5000 });
            if (activeTabRef.current !== 'tasks') setUnreadTasks(true);
            mutate();
        });

        return () => { pusher.unsubscribe(channelName); };
    }, [apiData?.data?.userId, mutate]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const toastId = toast.loading("Updating status...");
        try {
            const res = await fetch(`/api/admin/security/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error("Failed");

            toast.success(newStatus === 'COMPLETED' ? "Task Completed! 🎉" : "Status Updated!", { id: toastId });
            setSelectedTask(null);
            mutate();
        } catch (e) {
            toast.error("Update failed.", { id: toastId });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[100dvh] bg-[#f8fafc] p-4 md:p-8 space-y-6 max-w-7xl mx-auto flex flex-col">
                <Skeleton className="h-48 md:h-64 w-full rounded-[2.5rem]" />
                <div className="flex overflow-x-auto gap-3 pb-2"><Skeleton className="h-14 w-1/2 shrink-0 rounded-2xl" /><Skeleton className="h-14 w-1/2 shrink-0 rounded-2xl" /></div>
                <Skeleton className="h-[50vh] w-full rounded-[2.5rem]" />
            </div>
        );
    }

    const { finances = [], tasks = [], netBalance = 0 } = apiData?.data || {};

    const activeTasks = tasks.filter((t: any) => t.status !== 'COMPLETED');
    const doneTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
    const displayTasks = taskTab === 'Active' ? activeTasks : doneTasks;

    return (
        <div className="min-h-[100dvh] bg-[#f8fafc] pb-32 font-sans selection:bg-purple-900 selection:text-white">
            <Toaster position="top-center" richColors theme="light" toastOptions={{ style: { borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -5px rgb(0 0 0 / 0.1)' } }} />

            <header className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-5 md:p-10 pb-16 md:pb-24 rounded-b-[2.5rem] md:rounded-b-[3rem] shadow-xl relative overflow-hidden transform-gpu">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[80px] pointer-events-none hidden sm:block"></div>

                <div className="flex flex-col relative z-10 max-w-[1600px] mx-auto">
                    <div className="flex flex-wrap items-center gap-2.5 mb-5 md:mb-6">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide shadow-sm text-emerald-50">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span className="tabular-nums font-mono text-sm tracking-tighter">
                                {mounted ? time.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' }) : '--:--:-- --'}
                            </span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide shadow-sm text-purple-100">
                            <Calendar className="w-4 h-4 text-purple-300" />
                            {nepaliDateStr}
                        </motion.div>
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-purple-100 tracking-tight">Welcome,</h2>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-sm mt-1">Employee Portal</h1>
                </div>
            </header>

            <main className="px-3 md:px-8 -mt-8 md:-mt-16 space-y-5 md:space-y-6 max-w-[1600px] mx-auto relative z-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Card className="border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.06)] bg-white/90 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-5 md:p-8 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Total Cash Ledger</p>
                                <h3 className={cn("text-3xl md:text-5xl font-black tracking-tight drop-shadow-sm", netBalance < 0 ? "text-red-500" : "text-purple-900")}>
                                    Rs {Math.abs(netBalance).toLocaleString('en-IN')}
                                </h3>
                                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold bg-slate-50 px-2.5 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                    {netBalance < 0 ? (
                                        <><TrendingDown className="w-3.5 h-3.5 text-red-500" /> <span className="text-slate-600">Advance exceeds salary</span></>
                                    ) : (
                                        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-slate-600">Salary Given </span></>
                                    )}
                                </div>
                            </div>
                            <div className="hidden sm:flex bg-purple-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-purple-100 shadow-inner">
                                <Wallet className="text-purple-600 w-10 h-10 md:w-12 md:h-12" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); activeTabRef.current = v; if (v === 'tasks') setUnreadTasks(false); }} className="w-full">
                    <TabsList className="grid grid-cols-2 w-full gap-2 mb-4 md:mb-6 h-14 md:h-16 bg-white shadow-sm border border-slate-100 rounded-[1.5rem] p-1.5">
                        <TabsTrigger value="tasks" className="h-full rounded-xl font-bold text-sm data-[state=active]:bg-purple-900 data-[state=active]:text-white transition-all bg-transparent relative">
                            <LayoutList className="w-4 h-4 mr-2" /> My Tasks
                            {unreadTasks && <span className="absolute top-2 right-3 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span></span>}
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="h-full rounded-xl font-bold text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 transition-all bg-transparent">
                            <Wallet className="w-4 h-4 mr-2" /> Payroll & Wallet
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tasks" className="animate-in fade-in zoom-in-[0.98] duration-300 outline-none">
                        <Card className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.06)] rounded-[2rem] md:rounded-[2.5rem] flex flex-col min-h-[450px] overflow-hidden">
                            <CardHeader className="bg-white/50 border-b border-slate-100 p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl shadow-inner"><Briefcase className="w-6 h-6" /></div>
                                    <div>
                                        <CardTitle className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Assigned Tasks</CardTitle>
                                        <CardDescription className="font-bold text-slate-500 text-xs md:text-sm">Operations delegated directly to you.</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center p-1 bg-slate-100/80 rounded-[1rem] border border-slate-200/50 shadow-inner w-full md:w-auto">
                                    <button onClick={() => setTaskTab('Active')} className={cn("flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all", taskTab === 'Active' ? "bg-white text-purple-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700")}>Active ({activeTasks.length})</button>
                                    <button onClick={() => setTaskTab('Done')} className={cn("flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all", taskTab === 'Done' ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700")}>Done ({doneTasks.length})</button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8fafc]/50">
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {displayTasks.length === 0 ? (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12 md:py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                                                {taskTab === 'Active' ? <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300 mb-3" /> : <ListX className="mx-auto h-12 w-12 text-slate-300 mb-3" />}
                                                <h3 className="text-lg md:text-xl font-black text-slate-700 tracking-tight">{taskTab === 'Active' ? "All Caught Up!" : "No Completed Tasks"}</h3>
                                            </motion.div>
                                        ) : (
                                            displayTasks.map((task: any) => {
                                                const isCompleted = task.status === 'COMPLETED';
                                                const isToday = task.dateBS === todayBS;
                                                let priorityColor = "bg-purple-400";
                                                if (task.priority === 'URGENT') priorityColor = "bg-red-500";
                                                if (task.priority === 'HIGH') priorityColor = "bg-orange-500";

                                                return (
                                                    <motion.div layout initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} key={task._id} onClick={() => setSelectedTask(task)} className={cn("group relative flex items-center justify-between p-4 rounded-2xl shadow-sm border transition-all cursor-pointer transform-gpu active:scale-[0.98]", isCompleted ? "bg-emerald-50/30 border-emerald-100/60" : "bg-white border-slate-100 hover:border-purple-200 hover:shadow-md")}>
                                                        <div className="flex items-center gap-3 w-full">
                                                            <div className={cn("w-1.5 h-10 rounded-full shrink-0", isCompleted ? "bg-emerald-400" : priorityColor)} />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {isToday && !isCompleted && <span className="bg-red-50 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse border border-red-100">Today</span>}
                                                                    <span className={cn("text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider", isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{task.dateBS}</span>
                                                                </div>
                                                                <h4 className={cn("font-black text-sm md:text-base truncate tracking-tight", isCompleted ? "line-through text-slate-500" : "text-slate-900")}>{task.title}</h4>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 pl-2">
                                                            {!isCompleted && <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task._id, 'COMPLETED'); }} className="p-1.5 rounded-full hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-colors"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" /></button>}
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

                    <TabsContent value="finance" className="animate-in fade-in zoom-in-[0.98] duration-300 outline-none">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {finances.length === 0 ? (
                                <div className="col-span-full text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm"><Wallet className="mx-auto h-12 w-12 text-slate-300 mb-3" /><p className="font-black text-slate-700 text-lg tracking-tight">No Transactions</p></div>
                            ) : (
                                finances.map((record: any, idx: number) => {
                                    const isAdvance = record.type === 'ADVANCE';
                                    return (
                                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={record._id} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-3 rounded-xl shadow-inner shrink-0", isAdvance ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600')}>{isAdvance ? <TrendingDown className="w-5 h-5" strokeWidth={2.5} /> : <TrendingUp className="w-5 h-5" strokeWidth={2.5} />}</div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm md:text-base tracking-tight">{record.type === 'SALARY' ? `Salary: ${record.month}` : record.type}</p>
                                                    <p className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">{formatDateTime(record.date)}</p>
                                                </div>
                                            </div>
                                            <span className={cn("font-black text-base md:text-lg", isAdvance ? 'text-orange-600' : 'text-emerald-600')}>{isAdvance ? '-' : '+'}Rs {record.amount.toLocaleString()}</span>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
                <DialogContent className="w-[95vw] sm:max-w-md rounded-[2rem] p-0 border-0 shadow-2xl bg-white overflow-hidden [&>button]:hidden">
                    <DialogHeader className="sr-only"><DialogTitle>Task Details</DialogTitle><DialogDescription>Details</DialogDescription></DialogHeader>
                    {selectedTask && (
                        <div className="flex flex-col max-h-[85vh]">
                            <div className="relative p-5 md:p-6 bg-[#f8fafc] border-b border-slate-100 shrink-0">
                                <div className={cn("absolute top-0 left-0 w-full h-1.5", selectedTask.status === 'COMPLETED' ? "bg-emerald-500" : "bg-purple-600")}></div>
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="outline" className={cn("font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md", selectedTask.priority === 'URGENT' ? "bg-red-50 text-red-600 border-red-200" : "bg-purple-50 text-purple-600 border-purple-200")}>{selectedTask.priority}</Badge>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">{selectedTask.dateBS}</span>
                                </div>
                                <h2 className={cn("text-xl md:text-2xl font-black tracking-tight leading-tight", selectedTask.status === 'COMPLETED' ? "text-slate-500 line-through" : "text-slate-900")}>{selectedTask.title}</h2>
                            </div>
                            <div className="p-5 md:p-6 space-y-5 overflow-y-auto">
                                <div>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" /> Instructions</p>
                                    <div className="font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed min-h-[80px]">{selectedTask.description || <span className="text-slate-400 italic">No additional instructions.</span>}</div>
                                </div>
                            </div>
                            <div className="p-5 md:p-6 pt-0 flex gap-3 shrink-0 mt-auto">
                                <Button variant="outline" onClick={() => setSelectedTask(null)} className="flex-1 h-12 rounded-xl font-bold text-slate-600 border-slate-200">Close</Button>
                                {selectedTask.status === 'PENDING' && <Button onClick={() => handleUpdateStatus(selectedTask._id, 'IN_PROGRESS')} className="flex-[2] h-12 rounded-xl bg-purple-700 hover:bg-purple-800 font-extrabold text-white shadow-md transform-gpu active:scale-95 transition-all text-sm"><PlayCircle className="mr-1.5 w-4 h-4" /> Start Execution</Button>}
                                {selectedTask.status === 'IN_PROGRESS' && <Button onClick={() => handleUpdateStatus(selectedTask._id, 'COMPLETED')} className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 font-extrabold text-white shadow-md transform-gpu active:scale-95 transition-all text-sm"><CheckCircle2 className="mr-1.5 w-4 h-4" /> Finish</Button>}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
