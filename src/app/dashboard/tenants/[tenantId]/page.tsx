'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'react-hot-toast';
import { printBill } from '@/lib/printBill';
import { RecordPaymentDialog } from '@/components/record-payment-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
    Building, Receipt, Zap, Calendar, Phone, AlertCircle, Download, ArrowLeft,
    Banknote, Hash, CircleUserRound, TrendingUp, TrendingDown, Scale, Droplets, Wrench, Shield, FileText, CheckCircle2, Share2, Printer, Trash2, MoreHorizontal
} from 'lucide-react';

// --- Types ---
import { IRentBill, IUtilityBill, IUser, IRoom } from '@/types';

type StatementEntry = (IRentBill & { type: 'Rent' }) | (IUtilityBill & { type: 'Utility' });

interface MemoizedData {
  filteredStatement: StatementEntry[];
  uniqueYears: string[];
  financialSummary: {
    totalBilled: number;
    totalPaid: number;
    totalDue: number;
  };
}

// --- Data Fetcher for SWR ---
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) {
        throw new Error('An error occurred while fetching the data.');
    }
    return res.json();
});

// --- Helper Functions & Reusable Components ---

const formatNepaliDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    return new NepaliDate(new Date(date)).format('YYYY MMMM DD');
};

const InfoItem = ({ icon, label, value, colorClass }: { icon: React.ReactNode, label: string, value?: string | number | null, colorClass: string }) => (
    <div className="flex flex-col bg-white/70 p-4 rounded-3xl border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{value || 'N/A'}</p>
            </div>
        </div>
    </div>
);

const StatCardApp = ({ title, value, Icon, delay, fromColor, badgeClass, iconColor }: { title: string; value: string | number; Icon: React.ElementType; delay: number; fromColor: string; badgeClass: string; iconColor: string; }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: "easeOut" }}>
        <Card className="relative overflow-hidden border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(11,40,99,0.08)] transition-all duration-500 rounded-[2.5rem] bg-white/70 backdrop-blur-xl group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${fromColor} to-transparent opacity-40 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700 pointer-events-none -z-10`}></div>
            <CardContent className="p-6 flex flex-col h-full z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center shadow-inner ${badgeClass} text-white`}>
                        <Icon className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                </div>
                <div className="mt-auto">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
                    <div className={`text-3xl font-black ${iconColor} tracking-tight`}>
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
      <div className="font-bold text-sm text-slate-800 text-right">{value}</div>
    </div>
);

const BillCard = ({ bill, onClick, onAction, onShare, onPrint }: { bill: StatementEntry; onClick: () => void; onAction: (action: 'pay' | 'delete', bill: StatementEntry) => void; onShare: (bill: StatementEntry) => void; onPrint: (bill: StatementEntry) => void; }) => {
    const isRent = bill.type === 'Rent';
    const amount = isRent ? bill.amount : bill.totalAmount;
    const description = isRent ? `Rent: ${bill.rentForPeriod}` : `Utility: ${bill.billingMonthBS}`;
    const Icon = isRent ? Receipt : Zap;

    return (
        <motion.div
            layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            onClick={onClick}
            className="flex items-center space-x-3 p-4 rounded-[2rem] border border-white/60 bg-white/70 backdrop-blur-xl cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(11,40,99,0.06)] transition-all duration-300 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${bill.status === 'PAID' ? 'from-green-100/50' : bill.status === 'PARTIALLY_PAID' ? 'from-blue-100/50' : 'from-red-100/50'} to-transparent opacity-60 rounded-full blur-xl pointer-events-none -z-10`}></div>
            <div className={`p-3 rounded-[1.2rem] flex-shrink-0 shadow-inner ${bill.status === 'PAID' ? 'bg-green-50 text-green-600 border border-green-100' : bill.status === 'PARTIALLY_PAID' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                <Icon className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0 pr-1 mt-0.5">
                <p className="text-base font-black tracking-tight text-slate-800 leading-snug truncate">{description}</p>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{formatNepaliDate(bill.billDateAD)}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0 min-w-max ml-1.5 pt-0.5">
                <p className="font-black text-lg tracking-tight text-[#0B2863]">Rs {amount.toLocaleString()}</p>
                
                {parseFloat(bill.paidAmount as any) > 0 && bill.status !== 'PAID' && (
                    <div className="flex flex-col items-end text-[10px] text-slate-500 gap-0.5 font-bold tracking-widest uppercase">
                        <p>Paid: <span className="text-green-600">Rs {(bill.paidAmount || 0).toLocaleString()}</span></p>
                        <p>Rem: <span className="text-red-500">Rs {(bill.remainingAmount ?? amount).toLocaleString()}</span></p>
                    </div>
                )}
                
                <div className="flex items-center justify-end gap-2 mt-1">
                    <Badge variant={bill.status === 'PAID' ? 'default' : bill.status === 'PARTIALLY_PAID' ? 'outline' : 'destructive'} className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 shadow-sm ${bill.status === 'PARTIALLY_PAID' ? 'border-primary text-primary' : ''}`}>{bill.status}</Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full transition-colors" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-100 p-2" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bill Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer py-2.5 font-medium rounded-lg" onClick={(e) => { e.stopPropagation(); onPrint(bill); }}><Printer className="mr-2 h-4 w-4" /> Print Bill</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer py-2.5 font-medium rounded-lg" onClick={(e) => { e.stopPropagation(); onShare(bill); }}><Share2 className="mr-2 h-4 w-4" /> Share Link</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {bill.status !== 'PAID' && <DropdownMenuItem className="cursor-pointer py-2.5 font-bold text-green-700 focus:bg-green-50 focus:text-green-800 rounded-lg" onClick={(e) => { e.stopPropagation(); onAction('pay', bill); }}><CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Record Payment</DropdownMenuItem>}
                            <DropdownMenuItem className="cursor-pointer py-2.5 font-bold text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg" onClick={(e) => { e.stopPropagation(); onAction('delete', bill); }}><Trash2 className="mr-2 h-4 w-4" /> Erase Document</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.div>
    );
};


// --- THE MAIN PAGE COMPONENT ---
export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { data: apiResponse, error, isLoading, mutate } = useSWR(`/api/admin/tenants/${tenantId}`, fetcher, {
    revalidateOnFocus: true,
  });
  
  const tenant: IUser | null = apiResponse?.data?.tenantDetails ?? null;
  const bills: StatementEntry[] = useMemo(() => {
    if (!apiResponse?.data) return [];
    const rentEntries: StatementEntry[] = (apiResponse.data.rentBills || []).map((b: IRentBill) => ({ ...b, type: 'Rent' }));
    const utilityEntries: StatementEntry[] = (apiResponse.data.utilityBills || []).map((b: IUtilityBill) => ({ ...b, type: 'Utility' }));
    return [...rentEntries, ...utilityEntries];
  }, [apiResponse]);
  
  const [selectedBill, setSelectedBill] = useState<StatementEntry | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [confirmation, setConfirmation] = useState<{ action: 'pay' | 'delete'; bill: StatementEntry; } | null>(null);

  const handleShare = async (bill: StatementEntry) => {
    const billUrl = `${window.location.origin}/bill/${bill._id}`;
    const desc = bill.type === 'Rent' ? `Rent Bill for ${tenant?.fullName} (${bill.rentForPeriod})` : `Utility Bill for ${tenant?.fullName} (${bill.billingMonthBS})`;
    
    const isRent = bill.type === 'Rent';
    const amount = isRent ? bill.amount : bill.totalAmount;
    const billStatus = bill.status;
    const remarksData = bill.remarks || '';
    
    let ratesStr = '';
    if (!isRent) {
        const eRate = bill.electricity?.ratePerUnit || bill.electricity?.rate || 19;
        const wRate = bill.water?.ratePerUnit || bill.water?.rate || 0.30;
        ratesStr = `Rates: Elec Rs ${eRate}/unit, Water Rs ${wRate}/Litre.\n`;
    }
    
    const shareText = `${desc}. \n` +
        `Total: Rs ${amount.toLocaleString('en-IN')}. \n` +
        `Status: ${billStatus}.\n` +
        ratesStr +
        (remarksData ? `Remarks: ${remarksData}\n\n` : `\n`) + 
        `View Full Details Here:`;

    if (navigator.share) {
        try {
            await navigator.share({ title: desc, text: shareText, url: billUrl });
        } catch (err) {
            if ((err as Error).name !== 'AbortError') toast.error("Could not share the bill.");
        }
    } else {
        try {
            await navigator.clipboard.writeText(`${shareText} ${billUrl}`);
            toast.success('Bill link copied to clipboard!');
        } catch (err) { toast.error('Could not copy link.'); }
    }
  };

  const handlePrint = (bill: StatementEntry) => {
    const billToPrint = { ...bill, tenantId: tenant, roomId: tenant?.roomId };
    printBill(billToPrint as any);
  };

  const handleAction = async () => {
    if (!confirmation) return;
    const { action, bill } = confirmation;
    
    if (action === 'delete') {
        const isRent = bill.type === 'Rent';
        const url = isRent ? `/api/rent-bills/${bill._id}` : `/api/utility-bills/${bill._id}`;
        const promise = fetch(url, { method: 'DELETE' }).then(async res => {
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to delete bill.`);
            }
            return res.json();
        });

        toast.promise(promise, {
            loading: `Erasing Document...`,
            success: () => {
                mutate();
                setSelectedBill(null);
                return `Document Erased.`;
            },
            error: (err) => err.message,
        });
    }
    setConfirmation(null);
  };
  
  const handlePaymentSuccess = () => {
      setConfirmation(null);
      setSelectedBill(null); 
      mutate();
  };
  
  const { filteredStatement, uniqueYears, financialSummary } = useMemo((): MemoizedData => {
    const sortedBills = [...bills].sort((a, b) => new Date(b.billDateAD).getTime() - new Date(a.billDateAD).getTime());
    const years = new Set(sortedBills.map(bill => new NepaliDate(new Date(bill.billDateAD)).getYear().toString()));
    const uniqueYears = ['all', ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
    const filtered = sortedBills.filter(bill => selectedYear === 'all' || new NepaliDate(new Date(bill.billDateAD)).getYear().toString() === selectedYear);
    const summary = filtered.reduce((acc, bill) => {
        const totalAmount = bill.type === 'Rent' ? bill.amount : bill.totalAmount;
        
        let actualPaidAmount = 0;
        let actualRemainingAmount = totalAmount;

        if (bill.status === 'PAID') {
            actualPaidAmount = totalAmount;
            actualRemainingAmount = 0;
        } else if (bill.status === 'PARTIALLY_PAID') {
            actualPaidAmount = bill.paidAmount || 0;
            actualRemainingAmount = bill.remainingAmount ?? (totalAmount - actualPaidAmount);
        } else {
            actualPaidAmount = bill.paidAmount || 0;
            actualRemainingAmount = totalAmount - actualPaidAmount;
        }
        
        acc.totalBilled += totalAmount;
        acc.totalPaid += actualPaidAmount;
        acc.totalDue += actualRemainingAmount;
        return acc;
    }, { totalBilled: 0, totalPaid: 0, totalDue: 0 });
    return { filteredStatement: filtered, uniqueYears, financialSummary: summary };
  }, [bills, selectedYear]);
  
  const handleDownloadCSV = () => {
    const csvData = filteredStatement.map(bill => {
        const isUtility = bill.type === 'Utility';
        return {
            'Bill ID': bill._id.toString(),'Bill Type': bill.type, 'Bill Date (BS)': formatNepaliDate(bill.billDateAD), 'Status': bill.status,
            'Period': isUtility ? bill.billingMonthBS : bill.rentForPeriod, 'Total Amount': isUtility ? bill.totalAmount : bill.amount,
            'Remarks': bill.remarks || ''
        };
    });
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `statement-${tenant?.fullName?.replace(' ', '_')}-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const roomInfo = tenant?.roomId as IRoom | undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4"><Skeleton className="h-16 w-16 rounded-full" /><div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-5 w-64" /></div></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Skeleton className="h-32 rounded-[2rem]" /><Skeleton className="h-32 rounded-[2rem]" /><Skeleton className="h-32 rounded-[2rem]" /><Skeleton className="h-32 rounded-[2rem]" /></div>
        <Skeleton className="h-96 rounded-[2.5rem]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-xl font-black">Link Failed</AlertTitle>
            <AlertDescription className="font-medium mt-2">Could not retrieve secure tenant database node. Verify network connection.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-hidden selection:bg-[#0B2863]/20">
      {/* Ambient Background Shimmers */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-50/50 blur-[120px] pointer-events-none z-0"></div>

      <Drawer open={!!selectedBill} onOpenChange={(isOpen) => !isOpen && setSelectedBill(null)}>
        <DrawerContent className="p-0 outline-none pb-safe rounded-t-[2.5rem] bg-white/95 backdrop-blur-xl border-t border-white/50">
          {selectedBill && (
             <div className="w-full sm:max-w-md mx-auto p-6 overflow-y-auto max-h-[85vh]">
                <DrawerHeader className="mb-6 px-0 pb-0 text-center">
                    <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-inner ${selectedBill.type === 'Utility' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                        {selectedBill.type === 'Utility' ? <Zap className="h-8 w-8" /> : <Receipt className="h-8 w-8" />}
                    </div>
                    <DrawerTitle className="text-3xl font-black tracking-tight text-slate-800">
                        {selectedBill.type} Bill
                    </DrawerTitle>
                    <DrawerDescription className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                        For: {selectedBill.type === 'Rent' ? selectedBill.rentForPeriod : selectedBill.billingMonthBS}
                    </DrawerDescription>
                </DrawerHeader>
                
                {/* --- Content Area --- */}
                <div className="space-y-1 mt-6 px-1">
                    <DetailRow icon={<CircleUserRound size={16} className="text-slate-400" />} label="Tenant" value={tenant?.fullName ?? 'N/A'} />
                    <DetailRow icon={<Calendar size={16} className="text-slate-400" />} label="Bill Date" value={formatNepaliDate(selectedBill.billDateAD)} />
                    <DetailRow icon={<Hash size={16} className="text-slate-400" />} label="Status" value={<Badge className={`uppercase font-bold tracking-widest px-2 py-0.5 shadow-sm ${selectedBill.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : selectedBill.status === 'PARTIALLY_PAID' ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-none' : 'bg-rose-100 hover:bg-rose-200 text-rose-800'}`}>{selectedBill.status}</Badge>} />
                    
                    {selectedBill.type === 'Utility' && (
                        <div className="bg-slate-50/50 p-4 rounded-3xl mt-4 border border-slate-100">
                            <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={12}/> Utility Breakdown</h4>
                            <DetailRow icon={<Zap size={14} className="text-orange-400" />} label="Elec. Units" value={selectedBill.electricity.unitsConsumed} />
                            <DetailRow icon={<Banknote size={14} className="text-emerald-500"/>} label="Elec. Amount" value={`Rs ${selectedBill.electricity.amount.toLocaleString()}`} />
                            <DetailRow icon={<Droplets size={14} className="text-blue-400" />} label="Water Units" value={selectedBill.water.unitsConsumed} />
                            <DetailRow icon={<Banknote size={14} className="text-emerald-500" />} label="Water Amount" value={`Rs ${selectedBill.water.amount.toLocaleString()}`} />
                            <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest mt-4 mb-2 flex items-center gap-2"><Wrench size={12}/> Sur-Charges</h4>
                            <DetailRow icon={<Wrench size={14} className="text-slate-400"/>} label="Service Charge" value={`Rs ${selectedBill.serviceCharge.toLocaleString()}`} />
                            <DetailRow icon={<Shield size={14} className="text-slate-400" />} label="Security Charge" value={`Rs ${selectedBill.securityCharge.toLocaleString()}`} />
                        </div>
                    )}
                    
                    {selectedBill.remarks && (
                        <div className="pt-6">
                            <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3"><FileText size={14} /> Official Remarks</h4>
                            <div className="text-sm font-medium text-slate-700 bg-yellow-50 overflow-hidden p-4 rounded-2xl border border-yellow-100 shadow-inner italic">"{selectedBill.remarks}"</div>
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-6 mt-6 border-t-2 border-dashed border-slate-200">
                        <div className="font-bold text-[11px] text-slate-500 uppercase tracking-widest">Total Amount</div>
                        <div className="font-black text-3xl tracking-tight text-[#0B2863]">Rs {(selectedBill.type === 'Rent' ? selectedBill.amount : selectedBill.totalAmount).toLocaleString()}</div>
                    </div>
                    
                    {(parseFloat(selectedBill.paidAmount as any) > 0) && (
                        <div className="bg-slate-100 p-5 rounded-3xl mt-6 border border-slate-200 shadow-inner">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Capital Cleared</span>
                                <span className="font-black text-emerald-600 text-xl">Rs {(selectedBill.paidAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-300 rounded-full h-3 overflow-hidden mb-4 shadow-inner">
                                <div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min(((selectedBill.paidAmount || 0) / (selectedBill.type === 'Rent' ? selectedBill.amount : selectedBill.totalAmount)) * 100, 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center bg-red-50 p-3 rounded-2xl border border-red-100">
                                <span className="font-bold text-[10px] uppercase tracking-widest text-red-800">Remaining</span>
                                <span className="font-black text-rose-600 text-2xl tracking-tight">Rs {(selectedBill.remainingAmount ?? (selectedBill.type === 'Rent' ? selectedBill.amount : selectedBill.totalAmount)).toLocaleString()}</span>
                            </div>
                            
                            {selectedBill.paymentHistory && selectedBill.paymentHistory.length > 0 && (
                                <div className="mt-5 pt-5 border-t border-slate-200 border-dashed">
                                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 size={12}/> Installment Log</h5>
                                    <div className="space-y-3">
                                        {selectedBill.paymentHistory.map((pmt: any, idx: number) => (
                                            <div key={idx} className="flex flex-row justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <div className="font-bold text-xs uppercase tracking-widest text-slate-700">{formatNepaliDate(pmt.date)}</div>
                                                    {pmt.remarks && <div className="text-[10px] font-medium text-slate-400 italic mt-0.5 truncate">{pmt.remarks}</div>}
                                                </div>
                                                <div className="font-black text-emerald-600 shrink-0 tracking-tight text-lg">Rs {pmt.amount.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <DrawerFooter className="px-0 pt-8 pb-4">
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2 font-bold h-14 rounded-2xl shadow-sm hover:bg-slate-50 border-slate-200 text-slate-700" onClick={() => handlePrint(selectedBill)}>
                            <Printer className="w-5 h-5" /> Print
                        </Button>
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2 font-bold h-14 rounded-2xl shadow-sm hover:bg-slate-50 border-slate-200 text-slate-700" onClick={() => handleShare(selectedBill)}>
                            <Share2 className="w-5 h-5 opacity-80" /> Share
                        </Button>
                        {selectedBill.status !== 'PAID' && (
                            <Button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-2xl shadow-md active:scale-95 transition-transform" onClick={() => setConfirmation({ action: 'pay', bill: selectedBill })}>
                                <CheckCircle2 className="w-5 h-5 opacity-90" /> Submit Pay
                            </Button>
                        )}
                        <Button variant="destructive" className={`w-full flex items-center justify-center gap-2 font-bold h-14 rounded-2xl shadow-md active:scale-95 transition-transform ${selectedBill.status === 'PAID' ? "col-span-2" : ""}`} onClick={() => setConfirmation({ action: 'delete', bill: selectedBill })}>
                            <Trash2 className="w-5 h-5 opacity-90" /> Erase
                        </Button>
                    </div>
                </DrawerFooter>
             </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* --- Page Body --- */}
      <div className="container mx-auto p-4 md:p-8 space-y-10 relative z-10 pt-8 md:pt-10">
        
        {/* Header Ribbon */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-start md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-5 w-full md:w-auto">
                <Button variant="outline" size="icon" className="h-12 w-12 flex-shrink-0 rounded-full bg-white shadow-sm hover:shadow-md transition-all active:scale-90 border-slate-200 text-slate-500" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div className="flex items-center gap-5">
                    <Avatar className="h-16 w-16 border-4 border-white shadow-lg bg-slate-100 flex-shrink-0 hidden md:flex">
                        <AvatarFallback className="text-2xl font-black text-[#0B2863] bg-gradient-to-br from-blue-50 to-indigo-100">
                            {tenant?.fullName?.split(' ').map(n=>n[0]).join('') || 'T'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="mt-1 md:mt-0">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-800 leading-tight">{tenant?.fullName}</h1>
                        <p className="text-[11px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">Tenant Profile & Financial Statement</p>
                    </div>
                </div>
            </div>
        </motion.div>
        
        {/* Key Info Tiles */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                <InfoItem icon={<Building className="text-blue-500 h-5 w-5"/>} label="Unit" value={roomInfo?.roomNumber} colorClass="bg-blue-50" />
                <InfoItem icon={<Receipt className="text-indigo-500 h-5 w-5"/>} label="Rent" value={roomInfo ? `Rs ${roomInfo.rentAmount.toLocaleString()}`: 'N/A'} colorClass="bg-indigo-50" />
                <InfoItem icon={<Phone className="text-emerald-500 h-5 w-5"/>} label="Mobile" value={tenant?.phoneNumber} colorClass="bg-emerald-50" />
                <InfoItem icon={<Calendar className="text-orange-500 h-5 w-5"/>} label="Lease End" value={formatNepaliDate(tenant?.leaseEndDate)} colorClass="bg-orange-50" />
            </div>
        </motion.div>
        
        {/* Giant Stat Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatCardApp 
                title="Total Deficit" value={`Rs ${financialSummary.totalDue.toLocaleString()}`} Icon={Scale} delay={0.2}
                fromColor="from-red-400" badgeClass="bg-rose-500 shadow-[0_5px_15px_rgba(244,63,94,0.3)]" iconColor="text-rose-600"
            />
            <StatCardApp 
                title="Capital Cleared" value={`Rs ${financialSummary.totalPaid.toLocaleString()}`} Icon={TrendingUp} delay={0.3}
                fromColor="from-emerald-400" badgeClass="bg-emerald-500 shadow-[0_5px_15px_rgba(16,185,129,0.3)]" iconColor="text-emerald-600"
            />
            <StatCardApp 
                title="Cumulative Billed" value={`Rs ${financialSummary.totalBilled.toLocaleString()}`} Icon={Banknote} delay={0.4}
                fromColor="from-blue-400" badgeClass="bg-blue-500 shadow-[0_5px_15px_rgba(59,130,246,0.3)]" iconColor="text-[#0B2863]"
            />
        </div>

        {/* Ledger */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] bg-white/70 backdrop-blur-xl overflow-hidden">
                <CardHeader className="p-6 md:p-8 border-b border-white/50 bg-white/40">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Financial Ledger</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Complete historic statement index</CardDescription>
                        </div>
                        <div className="flex w-full md:w-auto items-center gap-3 self-start md:self-center">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-full md:w-[160px] h-12 bg-white rounded-xl shadow-sm border-transparent font-bold text-slate-600 focus:ring-blue-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl border-slate-100 font-medium pb-1">
                                    {uniqueYears.map((y: string) => <SelectItem key={y} value={y} className="py-2.5">{y === 'all' ? 'All Fiscal Years' : `${y} B.S.`}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleDownloadCSV} variant="outline" size="icon" disabled={filteredStatement.length === 0} className="h-12 w-12 rounded-xl bg-white border-transparent shadow-sm hover:bg-slate-50 flex-shrink-0 text-slate-500 hover:text-slate-800">
                                <Download className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isMobile ? (
                        <div className="p-4 space-y-4">
                            <AnimatePresence>
                                {filteredStatement.length > 0 ? filteredStatement.map((bill: StatementEntry) => (
                                    <BillCard 
                                      key={bill._id.toString()} 
                                      bill={bill} 
                                      onClick={() => setSelectedBill(bill)} 
                                      onAction={(act, b) => setConfirmation({ action: act, bill: b })}
                                      onShare={handleShare}
                                      onPrint={handlePrint}
                                    />
                                )) : <div className="text-center py-12"><FileText className="h-10 w-10 text-slate-300 mx-auto mb-3"/><p className="text-sm font-bold uppercase tracking-widest text-slate-400">No documents drafted.</p></div>}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="overflow-x-auto p-4 py-2">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-slate-200 hover:bg-transparent">
                                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Class</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Drafted On</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400 min-w-[120px]">Memo</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                                        <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-slate-400">Valuation</TableHead>
                                        <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-slate-400">Cleared</TableHead>
                                        <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-slate-400">Deficit</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStatement.length > 0 ? filteredStatement.map((bill: StatementEntry) => {
                                        const amount = bill.type === 'Rent' ? bill.amount : bill.totalAmount;
                                        const paid = bill.paidAmount || 0;
                                        const remaining = bill.remainingAmount ?? amount;
                                        return (
                                        <TableRow key={bill._id.toString()} onClick={() => setSelectedBill(bill)} className="cursor-pointer hover:bg-slate-50 border-b border-slate-100 transition-colors">
                                            <TableCell><Badge variant="outline" className={`border-none shadow-sm uppercase tracking-widest text-[10px] px-2 py-0.5 ${bill.type === 'Rent' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{bill.type}</Badge></TableCell>
                                            <TableCell className="font-black text-xs text-slate-700 whitespace-nowrap">{formatNepaliDate(bill.billDateAD)}</TableCell>
                                            <TableCell className="text-xs font-bold text-slate-500">{bill.type === 'Rent' ? bill.rentForPeriod : `${bill.electricity.unitsConsumed} Units`}</TableCell>
                                            <TableCell><Badge className={`uppercase tracking-widest text-[10px] px-2 py-0.5 shadow-sm font-bold ${bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border-none' : bill.status === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-none' : 'bg-rose-100 text-rose-800 border-none'}`}>{bill.status}</Badge></TableCell>
                                            <TableCell className="text-right font-black text-[#0B2863]">Rs {amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600 text-xs">{bill.status === 'PARTIALLY_PAID' || paid > 0 ? `Rs ${paid.toLocaleString()}` : '-'}</TableCell>
                                            <TableCell className="text-right font-black text-rose-600 text-[13px]">{bill.status === 'PARTIALLY_PAID' || remaining > 0 ? `Rs ${remaining.toLocaleString()}` : '-'}</TableCell>
                                            <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-slate-200 rounded-full" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-100 p-2" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bill Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="cursor-pointer py-2.5 font-medium rounded-lg" onClick={(e) => { e.stopPropagation(); handlePrint(bill); }}><Printer className="mr-2 h-4 w-4" /> Print Document</DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer py-2.5 font-medium rounded-lg" onClick={(e) => { e.stopPropagation(); handleShare(bill); }}><Share2 className="mr-2 h-4 w-4 opacity-80" /> Share Encrypted Link</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {bill.status !== 'PAID' && <DropdownMenuItem className="cursor-pointer py-2.5 font-bold text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800 rounded-lg" onClick={(e) => { e.stopPropagation(); setConfirmation({ action: 'pay', bill }); }}><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Verify Payment</DropdownMenuItem>}
                                                    <DropdownMenuItem className="cursor-pointer py-2.5 font-bold text-rose-600 focus:text-rose-700 focus:bg-rose-50 rounded-lg" onClick={(e) => { e.stopPropagation(); setConfirmation({ action: 'delete', bill }); }}><Trash2 className="mr-2 h-4 w-4" /> Shred Document</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    );
                                    }) : (
                                    <TableRow><TableCell colSpan={8} className="h-32 text-center text-sm font-bold uppercase tracking-widest text-slate-400">No documents exist.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
      </div>

      {/* --- Unified Overlays --- */}
      <AlertDialog open={!!confirmation && confirmation.action === 'delete'} onOpenChange={() => setConfirmation(null)}>
          <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-8 bg-white/95 backdrop-blur-xl max-w-sm">
              <AlertDialogHeader>
                  <div className="w-16 h-16 bg-rose-50 rounded-[1.8rem] flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
                      <Trash2 className="h-7 w-7 text-rose-600" />
                  </div>
                  <AlertDialogTitle className="text-2xl font-black text-center tracking-tight text-slate-800">Shred Document?</AlertDialogTitle>
                  <AlertDialogDescription className="text-center font-medium text-slate-500 mt-2">
                      This will permanently purge this explicit bill from the financial ledger. This action is irreversible.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-8 flex items-center justify-center gap-3 sm:justify-center">
                  <AlertDialogCancel className="w-full sm:w-1/2 rounded-xl h-12 font-bold shadow-none border-slate-200 text-slate-600 m-0">Abort</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAction} className="w-full sm:w-1/2 rounded-xl h-12 font-bold bg-rose-600 hover:bg-rose-700 shadow-md text-white m-0">
                      Confirm Shred
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      {confirmation?.action === 'pay' && (
          <RecordPaymentDialog 
              isOpen={true} 
              onClose={() => setConfirmation(null)} 
              onSuccess={handlePaymentSuccess} 
              billId={confirmation.bill._id.toString()} 
              targetUrl={confirmation.bill.type === 'Rent' ? `/api/rent-bills/${confirmation.bill._id}/pay` : `/api/utility-bills/${confirmation.bill._id}/pay`} 
              totalAmount={confirmation.bill.type === 'Rent' ? confirmation.bill.amount : confirmation.bill.totalAmount} 
              remainingAmount={confirmation.bill.remainingAmount ?? (confirmation.bill.type === 'Rent' ? confirmation.bill.amount : confirmation.bill.totalAmount)} 
          />
      )}
    </div>
  );
}