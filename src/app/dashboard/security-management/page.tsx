'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2, Wallet, TrendingUp, TrendingDown, UserCheck, Calendar, FileText,
    LayoutList, MapPin, CheckCircle2, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ✅ Utility and Premium Date Picker
import { cn } from '@/lib/utils';
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';
import 'nepali-datepicker-reactjs/dist/index.css';
import NepaliDate from 'nepali-date-converter';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const formatNepaliDateTime = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const npDate = new NepaliDate(date);
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${npDate.format('YYYY MMMM DD')}, ${time}`;
};

export default function SecurityManagementPage() {
    const { data, mutate, isLoading } = useSWR('/api/security/dashboard', fetcher);

    // Dialog States
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payment Form State
    const [payType, setPayType] = useState<'SALARY' | 'BONUS' | 'ADVANCE'>('SALARY');
    const [amount, setAmount] = useState('');
    const [month, setMonth] = useState('');
    const [remarks, setRemarks] = useState('');
    const [payDateBS, setPayDateBS] = useState(new NepaliDate().format('YYYY-MM-DD')); // ✅ Payment Date State

    // Task Form State
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskLocation, setTaskLocation] = useState('');
    const [taskPriority, setTaskPriority] = useState('MEDIUM');
    const [taskDateBS, setTaskDateBS] = useState(new NepaliDate().format('YYYY-MM-DD'));

    // --- Handlers ---
    const handlePayment = async () => {
        if (!amount || (payType === 'SALARY' && !month) || !payDateBS) return toast.error("Please fill required fields");
        setIsSubmitting(true);
        try {
            // ✅ Convert BS to AD for database storage
            const paymentDateAD = new NepaliDate(payDateBS).toJsDate();

            const res = await fetch('/api/admin/security/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: payType,
                    amount: Number(amount),
                    month,
                    date: paymentDateAD,
                    remarks
                })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Payment Recorded & Guard Notified!");
            setIsPayDialogOpen(false);
            setAmount(''); setRemarks(''); setMonth('');
            mutate();
        } catch (e) { toast.error("Failed to record payment."); }
        finally { setIsSubmitting(false); }
    };

    const handleCreateTask = async () => {
        if (!taskTitle || !taskDateBS) return toast.error("Title and Date are required");
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/security/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: taskTitle, description: taskDesc, location: taskLocation,
                    priority: taskPriority, dateBS: taskDateBS
                })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Task Assigned! Guard Notified.");
            setIsTaskDialogOpen(false);
            setTaskTitle(''); setTaskDesc(''); setTaskLocation('');
            mutate();
        } catch (e) { toast.error("Failed to assign task."); }
        finally { setIsSubmitting(false); }
    };

    // --- Data Extraction ---
    const finances = data?.data?.finances || [];
    const tasks = data?.data?.tasks || [];
    const netBalance = data?.data?.netBalance || 0;
    const totalSalaryPaid = data?.data?.totalSalaryPaid || 0;
    const totalAdvanceGiven = data?.data?.totalAdvanceGiven || 0;

    if (isLoading) {
        return <div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#0B2863]" /></div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto transform-gpu pb-32 relative z-10">

            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 text-[#0B2863] tracking-tight">
                        <UserCheck className="h-8 w-8 text-blue-500" /> Security Operations
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage finances, salary, and assign daily tasks.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button onClick={() => setIsTaskDialogOpen(true)} variant="outline" className="w-full md:w-auto rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 shadow-sm h-12">
                        <LayoutList className="mr-2 h-5 w-5" /> Assign Task
                    </Button>
                    <Button onClick={() => setIsPayDialogOpen(true)} className="w-full md:w-auto shadow-lg shadow-blue-500/30 bg-[#0B2863] hover:bg-[#071b46] rounded-xl font-bold h-12">
                        <Wallet className="mr-2 h-5 w-5" /> Log Finance
                    </Button>
                </div>
            </div>

            {/* --- Tabs Layout --- */}
            <Tabs defaultValue="finance" className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-8 bg-slate-100/50 p-1 rounded-2xl h-14">
                    <TabsTrigger value="finance" className="rounded-xl font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-[#0B2863] data-[state=active]:shadow-sm transition-all">Finance & Salary</TabsTrigger>
                    <TabsTrigger value="tasks" className="rounded-xl font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-[#0B2863] data-[state=active]:shadow-sm transition-all">Daily Tasks</TabsTrigger>
                </TabsList>

                {/* ==========================================
                TAB 1: FINANCE & SALARY
            ============================================== */}
                <TabsContent value="finance" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <CardHeader className="pb-2"><CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Salary Paid</CardTitle></CardHeader>
                            <CardContent>
                                <span className="text-3xl font-extrabold text-[#0B2863]">Rs {totalSalaryPaid.toLocaleString()}</span>
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-bold"><TrendingUp className="h-4 w-4 text-emerald-500" /> Total amount earned by staff.</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <CardHeader className="pb-2"><CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Advance Given</CardTitle></CardHeader>
                            <CardContent>
                                <span className="text-3xl font-extrabold text-orange-600">Rs {totalAdvanceGiven.toLocaleString()}</span>
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-bold"><TrendingDown className="h-4 w-4 text-orange-500" /> Money taken early by staff.</p>
                            </CardContent>
                        </Card>

                        <Card className={cn("rounded-[2rem] border", netBalance < 0 ? "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100" : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100")}>
                            <CardHeader className="pb-2"><CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Net Calculated Balance</CardTitle></CardHeader>
                            <CardContent>
                                <span className={cn("text-3xl font-extrabold", netBalance < 0 ? "text-orange-700" : "text-emerald-700")}>
                                    Rs {Math.abs(netBalance).toLocaleString()}
                                </span>
                                <p className="text-xs text-slate-600 mt-2 font-bold">
                                    {netBalance < 0 ? "Guard owes advance recovery." : "Net settled amount."}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 p-6 flex flex-row items-center justify-between">
                            <div><CardTitle className="text-xl font-extrabold text-slate-900">Transaction History</CardTitle><CardDescription className="font-medium text-slate-500">All financial interactions with security staff.</CardDescription></div>
                            <Badge variant="outline" className="bg-white font-bold">{finances.length} Records</Badge>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 bg-slate-50/20">
                            {finances.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-white"><Wallet className="mx-auto h-12 w-12 text-slate-300 mb-3" /><p className="font-bold text-slate-400">No payment records found.</p></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {finances.map((record: any) => {
                                        const isAdvance = record.type === 'ADVANCE';
                                        return (
                                            <motion.div layout key={record._id} onClick={() => setSelectedTransaction(record)} className="group flex flex-col p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer transform-gpu active:scale-[0.98]">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={cn("p-3 rounded-2xl", isAdvance ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600")}>
                                                        {isAdvance ? <TrendingDown size={20} strokeWidth={2.5} /> : <TrendingUp size={20} strokeWidth={2.5} />}
                                                    </div>
                                                    <span className={cn("font-extrabold text-lg", isAdvance ? "text-orange-600" : "text-emerald-600")}>
                                                        {isAdvance ? '-' : '+'}Rs {record.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-extrabold text-slate-900">{record.type === 'SALARY' ? `Salary: ${record.month}` : record.type}</h4>
                                                    <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1"><Calendar size={12} /> {formatNepaliDateTime(record.date)}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==========================================
                TAB 2: DAILY TASKS
            ============================================== */}
                <TabsContent value="tasks" className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {tasks.length === 0 ? (
                                <div className="col-span-full text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                    <LayoutList className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                    <h3 className="text-lg font-extrabold text-slate-900">No Tasks Assigned</h3>
                                    <p className="text-slate-500 font-medium">Create a task to notify the security team.</p>
                                    <Button onClick={() => setIsTaskDialogOpen(true)} className="mt-6 rounded-xl font-bold bg-[#0B2863]">Create First Task</Button>
                                </div>
                            ) : (
                                tasks.map((task: any) => {
                                    const isCompleted = task.status === 'COMPLETED';
                                    const isPending = task.status === 'PENDING';
                                    return (
                                        <motion.div layout key={task._id} className={cn("flex flex-col p-5 bg-white border rounded-3xl shadow-sm transition-all", isCompleted ? "border-emerald-100 opacity-70" : "border-slate-100")}>
                                            <div className="flex justify-between items-start mb-3">
                                                <Badge variant="outline" className={cn("font-bold uppercase tracking-wider text-[10px]",
                                                    task.priority === 'URGENT' ? "bg-red-50 text-red-600 border-red-200" :
                                                        task.priority === 'HIGH' ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-blue-50 text-blue-600 border-blue-200"
                                                )}>
                                                    {task.priority} Priority
                                                </Badge>
                                                {isCompleted ? <CheckCircle2 className="text-emerald-500 h-5 w-5" /> : (isPending ? <Clock className="text-slate-400 h-5 w-5" /> : <Loader2 className="text-blue-500 h-5 w-5 animate-spin" />)}
                                            </div>
                                            <h4 className={cn("font-extrabold text-lg mb-1", isCompleted ? "text-slate-500 line-through" : "text-slate-900")}>{task.title}</h4>
                                            {task.description && <p className="text-sm font-medium text-slate-500 mb-4 line-clamp-2">{task.description}</p>}

                                            <div className="mt-auto pt-4 border-t border-slate-50 space-y-2">
                                                {task.location && <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /> {task.location}</p>}
                                                <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Calendar size={14} /> {task.dateBS}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- Dialogs --- */}

            {/* 1. Transaction Details Pop-up */}
            <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
                <DialogContent className="sm:max-w-md rounded-[2rem] border-0 shadow-2xl p-6 bg-white/95 backdrop-blur-xl">
                    <DialogHeader><DialogTitle className="flex items-center gap-2 font-extrabold text-xl"><FileText className="h-5 w-5 text-[#0B2863]" /> Transaction Details</DialogTitle></DialogHeader>
                    {selectedTransaction && (
                        <div className="space-y-6 py-4">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Type</p><Badge variant="outline" className="text-sm px-3 py-1 font-bold bg-white">{selectedTransaction.type}</Badge></div>
                                <div className="text-right"><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Amount</p><p className="text-2xl font-extrabold text-[#0B2863]">Rs {selectedTransaction.amount.toLocaleString()}</p></div>
                            </div>
                            <div className="space-y-1"><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Date Logged</p><p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" />{formatNepaliDateTime(selectedTransaction.date)}</p></div>
                            {selectedTransaction.type === 'SALARY' && (<div className="space-y-1"><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Salary Month</p><p className="text-sm font-bold text-slate-700">{selectedTransaction.month}</p></div>)}
                            <div className="space-y-1"><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Remarks</p><p className="text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">{selectedTransaction.remarks || "No remarks provided."}</p></div>
                        </div>
                    )}
                    <DialogFooter><Button onClick={() => setSelectedTransaction(null)} className="w-full rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200">Close</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. Record Payment Form Dialog */}
            <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen} modal={false}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] border-0 shadow-2xl p-6 bg-white/95 backdrop-blur-xl">
                    <DialogHeader><DialogTitle className="font-extrabold text-2xl text-[#0B2863]">Log Transaction</DialogTitle><DialogDescription className="font-medium text-slate-500">Record salary or advance for security staff.</DialogDescription></DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="space-y-2"><label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Type</label>
                            <Select value={payType} onValueChange={(v: any) => setPayType(v)}>
                                <SelectTrigger className="rounded-xl h-12 font-bold bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-2xl font-bold z-[110]">
                                    <SelectItem value="SALARY">Monthly Salary</SelectItem>
                                    <SelectItem value="BONUS">Bonus / Incentive</SelectItem>
                                    <SelectItem value="ADVANCE">Advance Given</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Amount (Rs)</label>
                                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs</span><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="pl-10 rounded-xl h-12 font-bold text-lg bg-white" placeholder="0" /></div>
                            </div>
                            <div className="space-y-2"><label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Date Paid (B.S.)</label>
                                <div className="h-12 w-full border border-slate-200 rounded-xl bg-white flex items-center focus-within:ring-2 focus-within:ring-[#0B2863] transition-all relative z-[100]">
                                    <NepaliDatePicker
                                        inputClassName="w-full h-full px-3 py-2 bg-transparent border-0 outline-none font-bold text-sm text-slate-700 cursor-pointer"
                                        value={payDateBS}
                                        onChange={(value: string) => setPayDateBS(value)}
                                        options={{ calenderLocale: 'en', valueLocale: 'en' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {payType === 'SALARY' && (
                            <div className="space-y-2"><label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Salary Month</label>
                                <Input value={month} onChange={e => setMonth(e.target.value)} placeholder="e.g. Bhadra 2082" className="rounded-xl h-12 font-bold bg-white" />
                            </div>
                        )}
                        <div className="space-y-2"><label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Remarks</label>
                            <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes..." className="resize-none rounded-xl font-medium bg-white" />
                        </div>
                    </div>
                    <DialogFooter>
                        <div className="flex gap-3 w-full">
                            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)} className="w-full rounded-xl font-bold h-12 border-slate-200">Cancel</Button>
                            <Button onClick={handlePayment} disabled={isSubmitting} className="w-full rounded-xl font-bold h-12 bg-[#0B2863]">{isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirm Record'}</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. Assign Task Dialog */}
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen} modal={false}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] border-0 shadow-2xl p-6 bg-white/95 backdrop-blur-xl">
                    <DialogHeader><DialogTitle className="font-extrabold text-2xl text-[#0B2863]">Assign Daily Task</DialogTitle><DialogDescription className="font-medium text-slate-500">Task will appear on the Guard's dashboard.</DialogDescription></DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="space-y-2"><label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Task Title</label>
                            <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="e.g. Clean Water Tank" className="rounded-xl h-12 font-bold bg-white" />
                        </div>
                        <div className="space-y-2"><label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Location (Optional)</label>
                            <Input value={taskLocation} onChange={e => setTaskLocation(e.target.value)} placeholder="e.g. 4th Floor Roof" className="rounded-xl h-12 font-bold bg-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Priority</label>
                                <Select value={taskPriority} onValueChange={setTaskPriority}>
                                    <SelectTrigger className="rounded-xl h-12 font-bold bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl font-bold z-[110]">
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Task Date (B.S.)</label>
                                <div className="h-12 w-full border border-slate-200 rounded-xl bg-white flex items-center focus-within:ring-2 focus-within:ring-[#0B2863] transition-all relative z-[100]">
                                    <NepaliDatePicker
                                        inputClassName="w-full h-full px-3 py-2 bg-transparent border-0 outline-none font-bold text-sm text-slate-700 cursor-pointer"
                                        value={taskDateBS}
                                        onChange={(value: string) => setTaskDateBS(value)}
                                        options={{ calenderLocale: 'en', valueLocale: 'en' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2"><label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Details</label>
                            <Textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="Task instructions..." className="resize-none rounded-xl font-medium bg-white" />
                        </div>
                    </div>
                    <DialogFooter>
                        <div className="flex gap-3 w-full">
                            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)} className="w-full rounded-xl font-bold h-12 border-slate-200">Cancel</Button>
                            <Button onClick={handleCreateTask} disabled={isSubmitting} className="w-full rounded-xl font-bold h-12 bg-blue-600 hover:bg-blue-700">{isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Assign Task'}</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}