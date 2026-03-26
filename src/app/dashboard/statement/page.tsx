'use client';

import { useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Loader2, FileClock, AlertTriangle, CheckCircle, Hourglass, ListX, Download, TrendingUp, Search, SlidersHorizontal,User ,CalendarDays} from 'lucide-react';
import { IRentBill, IUtilityBill, IUser } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMediaQuery } from 'usehooks-ts';
import Papa from 'papaparse';

// --- Imports for the "Best of Best" Pop-up ---
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Receipt,Wallet, Zap, Calendar, Hash, CircleUserRound, Banknote, Droplets, Wrench, Shield, FileText, Scale, ZapIcon, Settings, Info, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

type CombinedBill = (IRentBill & { type: 'Rent' }) | (IUtilityBill & { type: 'Utility' });
type Status = 'DUE' | 'PAID' | 'OVERDUE';
type FilterType = 'All' | 'Rent' | 'Utility';

// --- Reusable SWR fetcher function ---
const fetcher = (url: string) => fetch(url).then(res => res.json());

// --- Reusable Sub-Components ---
const StatusBadge = ({ status }: { status: Status }) => {
    const statusConfig: Record<Status, { text: string; icon: ReactNode; className: string }> = {
        PAID: { text: "Paid", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-emerald-100/80 text-emerald-700 border-emerald-200" },
        DUE: { text: "Due", icon: <Hourglass className="h-3.5 w-3.5" />, className: "bg-amber-100/80 text-amber-700 border-amber-200" },
        OVERDUE: { text: "Overdue", icon: <AlertTriangle className="h-3.5 w-3.5" />, className: "bg-red-100/80 text-red-700 border-red-200 animate-pulse" },
    };
    const config = statusConfig[status] || { text: status, icon: null, className: "bg-slate-100/80 text-slate-700" };

    return <Badge variant="outline" className={cn("inline-flex items-center gap-1.5 font-bold tracking-wide rounded-full px-2.5 py-0.5 backdrop-blur-md shadow-sm", config.className)}>{config.icon}<span>{config.text}</span></Badge>;
};

const StatCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: number }) => (
    <Card className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white/50 border-b border-slate-100/50">
            <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
            <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
        </CardHeader>
        <CardContent className="pt-6">
            <div className="text-3xl font-black text-slate-900 tracking-tight">Rs {value.toLocaleString('en-IN')}</div>
        </CardContent>
    </Card>
);

const BillCard = ({ bill, index, onClick }: { bill: CombinedBill, index: number, onClick: () => void }) => {
  const amount = bill.type === 'Rent' ? bill.amount : bill.totalAmount;
  const period = bill.type === 'Rent' ? bill.rentForPeriod : bill.billingMonthBS;
  const isRent = bill.type === 'Rent';
  const Icon = isRent ? Receipt : Zap;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
      <div 
        onClick={onClick}
        className="group relative flex flex-col justify-between p-5 bg-white border border-slate-100 rounded-2xl cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
      >
        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300", isRent ? "bg-gradient-to-r from-blue-50/50 to-transparent" : "bg-gradient-to-r from-orange-50/50 to-transparent")} />
        
        <div className="relative z-10 flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
             <div className={cn("p-2 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300 text-white", isRent ? "bg-blue-500" : "bg-orange-500")}>
                <Icon className="h-5 w-5" />
             </div>
             <div>
               <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                 {bill.type} Bill <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{period}</span>
               </h4>
               <p className="text-xs font-bold text-slate-400 mt-0.5">Date: {bill.billDateBS || new NepaliDate(bill.billDateAD).format('YYYY-MM-DD')}</p>
             </div>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center justify-between border-t border-slate-100 pt-3">
          <StatusBadge status={bill.status} />
          <div className="text-lg font-black text-slate-900">
            Rs {amount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- "BEST OF BEST" RESPONSIVE BILL DETAILS CONTENT ---
const PremiumBillContent = ({ bill, user, onClose }: { bill: CombinedBill, user: IUser | null, onClose: () => void }) => {
  const isUtility = bill.type === 'Utility';
  const totalAmount = isUtility ? (bill as IUtilityBill).totalAmount : (bill as IRentBill).amount;
  const period = isUtility ? (bill as IUtilityBill).billingMonthBS : (bill as IRentBill).rentForPeriod;

  return (
    <div className="flex flex-col h-full w-full bg-[#f8fafc]">
      {/* Header Area - Locked at Top */}
      <div className="relative p-6 md:p-8 bg-white border-b border-slate-100 shrink-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-400"></div>
        <div className="flex flex-row items-center gap-4 text-left">
          <div className={cn("shrink-0 p-4 rounded-2xl shadow-inner", !isUtility ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600")}>
            {!isUtility ? <Wallet className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{bill.type} Bill</h2>
            <p className="font-bold text-slate-400 mt-1">Details & Breakdown</p>
          </div>
        </div>
      </div>

      {/* Scrollable Body - This handles the scroll bug */}
      <div className="flex-1 overflow-y-auto styled-scrollbar p-6 md:p-8 space-y-6">
        
        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <User className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Tenant</span>
            </div>
            <span className="font-bold text-slate-800 line-clamp-1">{user?.fullName ?? 'N/A'}</span>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Period / Month</span>
            </div>
            <span className="font-bold text-[#0B2863] text-base leading-none">{period}</span>
          </div>
          
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Date (B.S)</span>
            </div>
            <span className="font-bold text-slate-800">{bill.billDateBS || new NepaliDate(bill.billDateAD).format('YYYY-MM-DD')}</span>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-start">
             <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Info className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Status</span>
            </div>
            <StatusBadge status={bill.status as Status} />
          </div>
        </div>

        <Separator className="bg-slate-200/60" />

        {/* Charges Area */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
             <Wallet className="w-5 h-5 text-slate-400" /> Charges Summary
          </h3>

          {!isUtility ? (
            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-center justify-between">
               <div>
                  <p className="text-xs font-extrabold text-blue-400 uppercase tracking-wider mb-1">Rent Period</p>
                  <p className="font-bold text-slate-800 text-lg">{(bill as IRentBill).rentForPeriod}</p>
               </div>
               <div className="text-right">
                  <p className="text-xs font-extrabold text-blue-400 uppercase tracking-wider mb-1">Amount</p>
                  <p className="font-black text-[#0B2863] text-xl">Rs {(bill as IRentBill).amount.toLocaleString('en-IN')}</p>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
                {/* Electricity Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl"><Zap className="w-5 h-5" /></div>
                        <h4 className="font-extrabold text-slate-800 text-base">Electricity</h4>
                      </div>
                      <span className="font-black text-slate-900 text-lg">Rs {(bill as IUtilityBill).electricity.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center">
                       <div><p className="text-[10px] font-extrabold text-slate-400 uppercase">Prev</p><p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).electricity.previousReading}</p></div>
                       <div className="border-x border-slate-200"><p className="text-[10px] font-extrabold text-slate-400 uppercase">Curr</p><p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).electricity.currentReading}</p></div>
                       <div><p className="text-[10px] font-extrabold text-yellow-500 uppercase">Units</p><p className="font-black text-slate-900 mt-0.5">{(bill as IUtilityBill).electricity.unitsConsumed}</p></div>
                    </div>
                </div>

                {/* Water Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Droplets className="w-5 h-5" /></div>
                        <h4 className="font-extrabold text-slate-800 text-base">Water</h4>
                      </div>
                      <span className="font-black text-slate-900 text-lg">Rs {(bill as IUtilityBill).water.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center">
                       <div><p className="text-[10px] font-extrabold text-slate-400 uppercase">Prev</p><p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).water.previousReading}</p></div>
                       <div className="border-x border-slate-200"><p className="text-[10px] font-extrabold text-slate-400 uppercase">Curr</p><p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).water.currentReading}</p></div>
                       <div><p className="text-[10px] font-extrabold text-blue-500 uppercase">Units</p><p className="font-black text-slate-900 mt-0.5">{(bill as IUtilityBill).water.unitsConsumed}</p></div>
                    </div>
                </div>

                {/* Additional Charges */}
                {((bill as IUtilityBill).serviceCharge > 0 || (bill as IUtilityBill).securityCharge > 0) && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                     {(bill as IUtilityBill).serviceCharge > 0 && (
                       <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-slate-600 font-bold text-sm"><Settings className="w-4 h-4 text-slate-400" /> Service Charge</div><span className="font-extrabold text-slate-800">Rs {(bill as IUtilityBill).serviceCharge.toLocaleString('en-IN')}</span></div>
                     )}
                     {(bill as IUtilityBill).serviceCharge > 0 && (bill as IUtilityBill).securityCharge > 0 && <Separator className="bg-slate-100" />}
                     {(bill as IUtilityBill).securityCharge > 0 && (
                       <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-slate-600 font-bold text-sm"><Shield className="w-4 h-4 text-slate-400" /> Security Charge</div><span className="font-extrabold text-slate-800">Rs {(bill as IUtilityBill).securityCharge.toLocaleString('en-IN')}</span></div>
                     )}
                  </div>
                )}
            </div>
          )}

          {/* Remarks Section */}
          {bill.remarks && bill.remarks.trim() !== '' && (
            <div className="mt-4 bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
              <h4 className="font-extrabold text-orange-800 text-sm mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Admin Remarks</h4>
              <p className="text-sm font-medium text-orange-900/80 whitespace-pre-wrap leading-relaxed">{bill.remarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer - Locked at Bottom */}
      <div className="bg-white border-t border-slate-100 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] z-10 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Payable</span>
            <span className="text-2xl sm:text-3xl font-black text-[#0B2863] tracking-tight">Rs {totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <Button variant="outline" onClick={onClose} className="rounded-xl h-12 px-6 font-bold text-slate-600">Close</Button>
      </div>
    </div>
  );
};

// --- Dialog/Drawer Wrapper ---
function StatementBillDetails({ bill, user, onClose }: { bill: CombinedBill | null, user: IUser | null, onClose: () => void }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (!bill) return null;

  if (isDesktop) {
    return (
      <Dialog open={!!bill} onOpenChange={(open) => !open && onClose()}>
        {/* Enforce strict height and flex constraints on the Dialog Content */}
        <DialogContent className="sm:max-w-md md:max-w-xl p-0 border-0 rounded-[2rem] shadow-2xl bg-transparent overflow-hidden flex flex-col max-h-[85vh]">
          <PremiumBillContent bill={bill} user={user} onClose={onClose} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={!!bill} onClose={onClose}>
      {/* Enforce strict height and flex constraints on the Drawer Content */}
      <DrawerContent className="flex flex-col max-h-[85vh] h-[85vh] bg-transparent border-0 rounded-t-[2rem] overflow-hidden p-0">
        <PremiumBillContent bill={bill} user={user} onClose={onClose} />
      </DrawerContent>
    </Drawer>
  );
}

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
      </div>
      <Skeleton className="h-10 w-full md:w-36" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-[2rem]" />
        <Skeleton className="h-32 rounded-[2rem]" />
        <Skeleton className="h-32 rounded-[2rem]" />
    </div>
    <Skeleton className="h-64 w-full rounded-[2rem]" />
  </div>
);

// --- Main Statement Page Component ---
export default function StatementPage() {
  const [selectedBill, setSelectedBill] = useState<CombinedBill | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('All');
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { data: userResponse, isLoading: isUserLoading } = useSWR('/api/auth/me', fetcher);
  const { data: rentResponse, isLoading: isRentLoading } = useSWR('/api/my-bills/rent', fetcher);
  const { data: utilityResponse, isLoading: isUtilityLoading } = useSWR('/api/my-bills/utility', fetcher);

  const user = userResponse?.user;
  const isLoading = isUserLoading || isRentLoading || isUtilityLoading;

  const { allBills, totalDue, totalBilled, totalPaid } = useMemo(() => {
    const rentBills: IRentBill[] = rentResponse?.data || [];
    const utilityBills: IUtilityBill[] = utilityResponse?.data || [];
    const combined: CombinedBill[] = [
      ...rentBills.map((bill) => ({ ...bill, type: 'Rent' as const })),
      ...utilityBills.map((bill) => ({ ...bill, type: 'Utility' as const }))
    ];
    combined.sort((a, b) => new Date(b.billDateAD).getTime() - new Date(a.billDateAD).getTime());
    
    let due = 0;
    let billed = 0;
    let paid = 0;

    combined.forEach(bill => {
      const amount = bill.type === 'Rent' ? bill.amount : bill.totalAmount;
      billed += amount;
      if (bill.status !== 'PAID') {
        due += amount;
      } else {
        paid += amount;
      }
    });
    
    return { allBills: combined, totalDue: due, totalBilled: billed, totalPaid: paid };
  }, [rentResponse, utilityResponse]);

  // --- Filtering Logic ---
  const filteredBills = useMemo(() => {
    return allBills.filter(bill => {
      // Filter by Type
      const matchesType = filterType === 'All' || bill.type === filterType;
      
      // Filter by Search Term (Month/Period)
      const period = bill.type === 'Rent' ? (bill as IRentBill).rentForPeriod : (bill as IUtilityBill).billingMonthBS;
      const matchesSearch = period.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [allBills, filterType, searchTerm]);

  const handleDownloadCSV = () => {
    const csvData = allBills.map(bill => {
        const isUtility = bill.type === 'Utility';
        return {
            'Bill ID': bill._id.toString(),'Bill Type': bill.type, 'Bill Date (BS)': bill.billDateBS, 'Status': bill.status,
            'Period': isUtility ? (bill as IUtilityBill).billingMonthBS : (bill as IRentBill).rentForPeriod, 
            'Total Amount': isUtility ? (bill as IUtilityBill).totalAmount : (bill as IRentBill).amount,
            'Paid On': bill.paidOnBS || 'N/A', 'Remarks': bill.remarks || ''
        };
    });
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `stg-tower-statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="p-4 md:p-8 max-w-[1600px] mx-auto"><LoadingSkeleton /></div>;
  }

  return (
    <>
      <StatementBillDetails bill={selectedBill} user={user} onClose={() => setSelectedBill(null)} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl"><FileClock className="h-8 w-8 text-[#0B2863]" /></div>
            <div>
              <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Financial History</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0B2863] tracking-tight">My Statement</h1>
            </div>
          </div>
          <Button onClick={handleDownloadCSV} className="w-full md:w-auto rounded-xl h-12 bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md font-bold transition-all">
            <Download className="mr-2 h-4 w-4 text-blue-500" /> Export CSV
          </Button>
        </div>

        {/* Mobile Total Due Summary */}
        {isMobile && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 rounded-[2rem] text-white shadow-lg shadow-red-500/20">
             <p className="text-sm font-bold opacity-90 uppercase tracking-widest mb-1">Outstanding Due</p>
             <p className="text-4xl font-black tracking-tight drop-shadow-sm">Rs {totalDue.toLocaleString()}</p>
          </div>
        )}
        
        {/* Desktop Stat Cards */}
        {!isMobile && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<Scale className="h-5 w-5 text-red-500"/>} title="Total Due" value={totalDue} />
                <StatCard icon={<TrendingUp className="h-5 w-5 text-green-500"/>} title="Total Paid" value={totalPaid} />
                <StatCard icon={<Banknote className="h-5 w-5 text-blue-500"/>} title="Total Billed" value={totalBilled} />
            </motion.div>
        )}

        {/* --- NEW: Premium Filter & Search Bar --- */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/60 backdrop-blur-xl p-3 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
           {/* Search Input */}
           <div className="relative w-full flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <Input
               placeholder="Search by month (e.g., Baisakh)..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 h-12 bg-white border-slate-100 hover:border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl w-full font-medium shadow-sm transition-all"
             />
           </div>
           
           {/* Segmented Toggles */}
           <div className="flex items-center p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto shrink-0 border border-slate-200/50">
             {(['All', 'Rent', 'Utility'] as FilterType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300", 
                    filterType === type 
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                  )}
                >
                  {type}
                </button>
             ))}
           </div>
        </div>

        {/* Desktop Table */}
        <Card className="hidden md:block border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4 pl-6">Type</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Bill Date (B.S.)</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Period / Month</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Status</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Paid On</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4 text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredBills.length > 0 ? (
                      filteredBills.map(bill => {
                        const period = bill.type === 'Rent' ? (bill as IRentBill).rentForPeriod : (bill as IUtilityBill).billingMonthBS;
                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            key={bill._id.toString()} 
                            onClick={() => setSelectedBill(bill)} 
                            className="cursor-pointer border-slate-100 hover:bg-slate-50/80 transition-colors group"
                          >
                            <TableCell className="pl-6 py-4">
                              <div className="flex items-center gap-2 font-bold text-slate-700 group-hover:text-[#0B2863]">
                                {bill.type === 'Rent' ? <Wallet className="h-4 w-4 text-blue-500" /> : <Zap className="h-4 w-4 text-orange-500" />} {bill.type}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 font-medium text-slate-600">{bill.billDateBS || new NepaliDate(bill.billDateAD).format('YYYY-MM-DD')}</TableCell>
                            <TableCell className="py-4 font-extrabold text-slate-800">{period}</TableCell>
                            <TableCell className="py-4"><StatusBadge status={bill.status} /></TableCell>
                            <TableCell className="py-4 font-medium text-slate-500">{bill.paidOnBS || '---'}</TableCell>
                            <TableCell className="py-4 text-right font-black text-slate-900 text-base pr-6">
                              Rs {bill.type === 'Rent' ? (bill as IRentBill).amount.toLocaleString('en-IN') : (bill as IUtilityBill).totalAmount.toLocaleString('en-IN')}
                            </TableCell>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <TableRow><TableCell colSpan={6} className="h-64 text-center"><div className="flex flex-col items-center justify-center gap-3 text-slate-400"><Search className="h-12 w-12 opacity-50" /><span className="font-bold text-lg text-slate-500">No matching bills found</span><p className="text-sm">Try adjusting your filters or search term.</p></div></TableCell></TableRow>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredBills.length > 0 ? (
              filteredBills.map((bill, index) => (
                <BillCard key={bill._id.toString()} bill={bill} index={index} onClick={() => setSelectedBill(bill)} />
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-3 text-slate-400 h-64 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
                  <Search className="h-10 w-10 opacity-50" />
                  <span className="font-bold text-base text-slate-500">No results found</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}