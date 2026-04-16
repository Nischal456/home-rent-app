'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'usehooks-ts';
import Papa from 'papaparse';
import NepaliDate from 'nepali-date-converter';

// --- UI Components & Icons ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Phone, Mail, ArrowLeft, Download, Wallet, CreditCard, Sparkles, TrendingDown,
    ShieldCheck, AlertCircle, Banknote, Calendar, Receipt, FileText, CheckCircle2,
    Briefcase
} from 'lucide-react';

// --- Types ---
import { IUser } from '@/types';

type StaffPaymentEntry = {
    _id: string;
    type: 'SALARY' | 'ADVANCE' | 'BONUS';
    amount: number;
    date: string | Date;
    month?: string;
    remarks?: string;
};

// --- Data Fetcher for SWR ---
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('An error occurred while fetching the data.');
    return res.json();
});

// --- Helper Functions ---
const formatNepaliDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    try { return new NepaliDate(new Date(date)).format('YYYY MMMM DD'); } 
    catch(e) { return new Date(date).toDateString(); }
};

const getRoleConfig = (role: string) => {
    switch(role) {
        case 'SECURITY': return { label: 'Security Guard', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' };
        case 'ACCOUNTANT': return { label: 'Accountant', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' };
        case 'CLEANER': return { label: 'Facility Cleaner', icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-50' };
        default: return { label: role, icon: Briefcase, color: 'text-slate-500', bg: 'bg-slate-50' };
    }
};

const getPayTypeConfig = (type: string) => {
    switch(type) {
        case 'SALARY': return { label: 'Base Salary', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700' };
        case 'BONUS': return { label: 'Bonus / Incentive', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50 text-amber-700' };
        case 'ADVANCE': return { label: 'Advance Draw', icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50 text-orange-700' };
        default: return { label: type, icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50 text-blue-700' };
    }
};

// --- Reusable Components ---
const InfoItem = ({ icon, label, value, colorClass }: { icon: React.ReactNode, label: string, value?: string | number | null, colorClass: string }) => (
    <div className="flex flex-col bg-white/70 p-4 rounded-3xl border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5 truncate max-w-[150px]">{value || 'N/A'}</p>
            </div>
        </div>
    </div>
);

const StatCardApp = ({ title, value, Icon, delay, fromColor, badgeClass, iconColor }: { title: string; value: string | number; Icon: React.ElementType; delay: number; fromColor: string; badgeClass: string; iconColor: string; }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: "easeOut" }}>
        <Card className="relative overflow-hidden border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(11,40,99,0.08)] transition-all duration-500 rounded-[2.5rem] bg-white/70 backdrop-blur-xl group h-full">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${fromColor} to-transparent opacity-40 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700 pointer-events-none -z-10`}></div>
            <CardContent className="p-6 flex flex-col h-full z-10 justify-between">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center shadow-inner ${badgeClass} text-white`}>
                        <Icon className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
                    <div className={`text-3xl font-black ${iconColor} tracking-tight break-words`}>
                        {value}
                    </div>
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">{icon}<span className="uppercase tracking-wider text-[11px] font-bold">{label}</span></div>
      <div className="font-bold text-sm text-slate-800 text-right max-w-[60%] text-right break-words">{value}</div>
    </div>
);

const TransactionCard = ({ tx, onClick }: { tx: StaffPaymentEntry; onClick: () => void; }) => {
    const config = getPayTypeConfig(tx.type);
    const Icon = config.icon;

    return (
        <motion.div
            layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            onClick={onClick}
            className="flex items-center space-x-3 p-4 rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(11,40,99,0.06)] transition-all duration-300 relative overflow-hidden group"
        >
            <div className={`p-3 rounded-[1.2rem] flex-shrink-0 shadow-inner ${config.bg} border border-slate-100`}>
                <Icon className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0 pr-1 mt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B2863]">{config.label}</p>
                <p className="text-base font-black tracking-tight text-slate-800 leading-snug truncate mt-0.5">{tx.month || 'Adhoc Log'}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0 min-w-max ml-1.5 pt-0.5">
                <p className={`font-black text-lg tracking-tight ${tx.type === 'ADVANCE' ? 'text-orange-600' : 'text-emerald-600'}`}>
                   {tx.type === 'ADVANCE' ? '-' : '+'}Rs {tx.amount.toLocaleString()}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{formatNepaliDate(tx.date)}</p>
            </div>
        </motion.div>
    );
};

// --- MAIN PAGE ---
export default function StaffProfilePage() {
    const router = useRouter();
    const params = useParams();
    const staffId = params.staffId as string;
    const isMobile = useMediaQuery("(max-width: 768px)");

    const { data: apiResponse, error, isLoading } = useSWR(`/api/admin/staff/${staffId}`, fetcher);
    
    const staff: IUser | null = apiResponse?.data?.staffDetails ?? null;
    const transactions: StaffPaymentEntry[] = apiResponse?.data?.payments ?? [];

    const [selectedTx, setSelectedTx] = useState<StaffPaymentEntry | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>('all');

    // Aggregate Calculations
    const { filteredTransactions, uniqueYears, stats } = useMemo(() => {
        const years = new Set(transactions.map(tx => new NepaliDate(new Date(tx.date)).getYear().toString()));
        const uniqueYears = ['all', ...Array.from(years).sort((a,b) => Number(b) - Number(a))];
        
        const filtered = transactions.filter(tx => 
            selectedYear === 'all' || new NepaliDate(new Date(tx.date)).getYear().toString() === selectedYear
        );

        const stats = filtered.reduce((acc, tx) => {
            if(tx.type === 'SALARY') acc.salary += tx.amount;
            if(tx.type === 'BONUS') acc.bonus += tx.amount;
            if(tx.type === 'ADVANCE') acc.advance += tx.amount;
            return acc;
        }, { salary: 0, bonus: 0, advance: 0, netCompensation: 0 });
        
        stats.netCompensation = stats.salary + stats.bonus;
        return { filteredTransactions: filtered, uniqueYears, stats };
    }, [transactions, selectedYear]);

    const handleDownloadCSV = () => {
        const csvData = filteredTransactions.map(tx => ({
            'Transaction ID': tx._id,
            'Date': formatNepaliDate(tx.date),
            'Category': tx.type,
            'Amount': tx.amount,
            'Applied Month': tx.month || 'N/A',
            'Internal Note': tx.remarks || ''
        }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `payroll-${staff?.fullName?.replace(' ', '_')}-${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-6">
                <div className="flex items-center gap-4"><Skeleton className="h-16 w-16 rounded-full" /><div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-5 w-64" /></div></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Skeleton className="h-32 rounded-[2rem]" /><Skeleton className="h-32 rounded-[2rem]" /><Skeleton className="h-32 rounded-[2rem]" /><Skeleton className="h-32 rounded-[2rem]" /></div>
                <Skeleton className="h-96 rounded-[2.5rem]" />
            </div>
        );
    }

    if (error || (!isLoading && !staff)) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] p-8">
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-xl font-black">Connection Failed</AlertTitle>
                    <AlertDescription className="font-medium mt-2">Could not retrieve secure personnel database node. Profile may not exist.</AlertDescription>
                </Alert>
            </div>
        );
    }

    const roleConfig = getRoleConfig(staff!.role);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-hidden selection:bg-[#0B2863]/20">
            {/* Ambient Background Shimmers */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none z-0"></div>
            <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-50/50 blur-[120px] pointer-events-none z-0"></div>

            {/* Native Transaction Drawer Modal */}
            <Drawer open={!!selectedTx} onOpenChange={(isOpen) => !isOpen && setSelectedTx(null)}>
                <DrawerContent className="p-0 outline-none pb-safe rounded-t-[2.5rem] bg-white/95 backdrop-blur-xl border-t border-white/50">
                {selectedTx && (() => {
                    const txConf = getPayTypeConfig(selectedTx.type);
                    const TxIcon = txConf.icon;
                    return (
                        <div className="w-full sm:max-w-md mx-auto p-6 overflow-y-auto max-h-[85vh]">
                            <DrawerHeader className="mb-6 px-0 pb-0 text-center">
                                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-inner ${txConf.bg}`}>
                                    <TxIcon className="h-8 w-8" />
                                </div>
                                <DrawerTitle className="text-3xl font-black tracking-tight text-slate-800">
                                    {txConf.label}
                                </DrawerTitle>
                                <DrawerDescription className="mt-2 text-sm font-bold uppercase tracking-widest text-[#0B2863]">
                                    Log: {selectedTx._id}
                                </DrawerDescription>
                            </DrawerHeader>
                            
                            <div className="space-y-1 mt-6 px-1">
                                <DetailRow icon={<ShieldCheck size={16} className="text-slate-400" />} label="Staff Name" value={staff?.fullName ?? 'N/A'} />
                                <DetailRow icon={<Calendar size={16} className="text-slate-400" />} label="Log Date" value={formatNepaliDate(selectedTx.date)} />
                                {selectedTx.type === 'SALARY' && (
                                    <DetailRow icon={<Calendar size={16} className="text-slate-400" />} label="Salary Month" value={selectedTx.month || '-'} />
                                )}
                                
                                {selectedTx.remarks && (
                                    <div className="pt-6">
                                        <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3"><FileText size={14} /> Official Remarks</h4>
                                        <div className="text-sm font-medium text-slate-700 bg-slate-50 overflow-hidden p-4 rounded-2xl border border-slate-100 shadow-inner italic">"{selectedTx.remarks}"</div>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-center pt-6 mt-6 border-t-2 border-dashed border-slate-200">
                                    <div className="font-bold text-[11px] text-slate-500 uppercase tracking-widest">Transaction Sum</div>
                                    <div className={`font-black text-3xl tracking-tight ${selectedTx.type === 'ADVANCE' ? 'text-orange-600' : 'text-emerald-600'}`}>
                                        Rs {selectedTx.amount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            
                            <DrawerFooter className="px-0 pt-8 pb-4">
                                <Button className="w-full flex items-center justify-center gap-2 bg-[#0B2863] hover:bg-blue-900 text-white font-bold h-14 rounded-2xl shadow-md active:scale-95 transition-transform" onClick={() => setSelectedTx(null)}>
                                    <CheckCircle2 className="w-5 h-5 opacity-90" /> Dismiss Viewer
                                </Button>
                            </DrawerFooter>
                        </div>
                    );
                })()}
                </DrawerContent>
            </Drawer>

            {/* --- Main Page Body --- */}
            <div className="container mx-auto p-4 md:p-8 space-y-10 relative z-10 pt-8 md:pt-10">
                
                {/* Header Ribbon */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-start md:items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-5 w-full md:w-auto">
                        <Button variant="outline" size="icon" className="h-12 w-12 flex-shrink-0 rounded-full bg-white shadow-sm hover:shadow-md transition-all active:scale-90 border-slate-200 text-slate-500" onClick={() => router.back()}>
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div className="flex items-center gap-5">
                            <Avatar className="h-16 w-16 border-4 border-white shadow-lg bg-slate-100 flex-shrink-0 hidden md:flex">
                                <AvatarImage src={staff!.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${staff!.fullName}`} className="object-cover" />
                                <AvatarFallback className={`text-2xl font-black ${roleConfig.color} bg-gradient-to-br from-slate-50 to-slate-100`}>
                                    {staff?.fullName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="mt-1 md:mt-0">
                                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-800 leading-tight">{staff?.fullName}</h1>
                                <p className="text-[11px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">HR Operations & Payroll Ledger</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
                
                {/* Identity Tiles */}
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                        <InfoItem icon={<roleConfig.icon className={`${roleConfig.color} h-5 w-5`}/>} label="Title" value={roleConfig.label} colorClass={roleConfig.bg} />
                        <InfoItem icon={<Phone className="text-slate-500 h-5 w-5"/>} label="Mobile Link" value={staff?.phoneNumber || 'Unlinked'} colorClass="bg-slate-50" />
                        <InfoItem icon={<Mail className="text-slate-500 h-5 w-5"/>} label="Mail Address" value={staff?.email} colorClass="bg-slate-50" />
                        <InfoItem icon={<Calendar className="text-slate-500 h-5 w-5"/>} label="Hire Date" value={formatNepaliDate(staff?.createdAt)} colorClass="bg-slate-50" />
                    </div>
                </motion.div>
                
                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-auto">
                    <StatCardApp 
                        title="Cleared Compensation" value={`Rs ${stats.netCompensation.toLocaleString()}`} Icon={CreditCard} delay={0.2}
                        fromColor="from-emerald-400" badgeClass="bg-emerald-500 shadow-[0_5px_15px_rgba(16,185,129,0.3)]" iconColor="text-emerald-700"
                    />
                    <StatCardApp 
                        title="Early Advances (Owed)" value={`Rs ${stats.advance.toLocaleString()}`} Icon={TrendingDown} delay={0.3}
                        fromColor="from-orange-400" badgeClass="bg-orange-500 shadow-[0_5px_15px_rgba(249,115,22,0.3)]" iconColor="text-orange-700"
                    />
                    <StatCardApp 
                        title="Performance Bonus" value={`Rs ${stats.bonus.toLocaleString()}`} Icon={Sparkles} delay={0.4}
                        fromColor="from-purple-400" badgeClass="bg-purple-500 shadow-[0_5px_15px_rgba(168,85,247,0.3)]" iconColor="text-purple-700"
                    />
                </div>

                {/* Main Payroll List */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <Card className="border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] bg-white/70 backdrop-blur-xl overflow-hidden">
                        <CardHeader className="p-6 md:p-8 border-b border-white/50 bg-white/40">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Financial Timeline</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Trace all internal compensation disbursements</CardDescription>
                                </div>
                                <div className="flex w-full md:w-auto items-center gap-3 self-start md:self-center">
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="w-full md:w-[160px] h-12 bg-white rounded-xl shadow-sm border-transparent font-bold text-slate-600 focus:ring-slate-100">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-slate-100 font-medium pb-1">
                                            {uniqueYears.map((y: string) => <SelectItem key={y} value={y} className="py-2.5">{y === 'all' ? 'All Fiscal Years' : `${y} B.S.`}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleDownloadCSV} variant="outline" size="icon" disabled={filteredTransactions.length === 0} className="h-12 w-12 rounded-xl bg-white border-transparent shadow-sm hover:bg-slate-50 flex-shrink-0 text-slate-500 hover:text-slate-800">
                                        <Download className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isMobile ? (
                                <div className="p-4 space-y-4">
                                    <AnimatePresence>
                                        {filteredTransactions.length > 0 ? filteredTransactions.map((tx: StaffPaymentEntry) => (
                                            <TransactionCard 
                                              key={tx._id} 
                                              tx={tx} 
                                              onClick={() => setSelectedTx(tx)} 
                                            />
                                        )) : <div className="text-center py-12"><Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3"/><p className="text-sm font-bold uppercase tracking-widest text-slate-400">No disbursements.</p></div>}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="overflow-x-auto p-4 py-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-slate-200 hover:bg-transparent">
                                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Date Exchanged</TableHead>
                                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Pay Type</TableHead>
                                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Applied Frame</TableHead>
                                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400 max-w-[200px]">Memo</TableHead>
                                                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-slate-400">Ledger Entry</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTransactions.length > 0 ? filteredTransactions.map((tx: StaffPaymentEntry) => {
                                                const config = getPayTypeConfig(tx.type);
                                                return (
                                                <TableRow key={tx._id} onClick={() => setSelectedTx(tx)} className="cursor-pointer hover:bg-slate-50 border-b border-slate-100 transition-colors">
                                                    <TableCell className="font-black text-xs text-slate-700 whitespace-nowrap">{formatNepaliDate(tx.date)}</TableCell>
                                                    <TableCell><Badge className={`uppercase tracking-widest text-[10px] px-2 py-0.5 shadow-sm font-bold ${config.bg} border-none`}>{config.label}</Badge></TableCell>
                                                    <TableCell className="text-xs font-bold text-slate-500">{tx.month || '-'}</TableCell>
                                                    <TableCell className="text-xs font-bold text-slate-400 max-w-[200px] truncate">{tx.remarks || '-'}</TableCell>
                                                    <TableCell className={`text-right font-black ${tx.type === 'ADVANCE' ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                        {tx.type === 'ADVANCE' ? '-' : '+'}Rs {tx.amount.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                                );
                                            }) : (
                                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-sm font-bold uppercase tracking-widest text-slate-400">No payroll activities exist.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
