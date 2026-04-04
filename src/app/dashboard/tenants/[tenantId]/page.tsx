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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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

// ✅ Type definition for the object returned by useMemo
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

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-muted-foreground mt-1">{icon}</div>
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold text-sm">{value || 'N/A'}</p>
        </div>
    </div>
);

const StatCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: number }) => (
    <Card className="hover:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">Rs {value.toLocaleString('en-IN')}</div>
        </CardContent>
    </Card>
);

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border/50">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">{icon}<span>{label}</span></div>
      <div className="font-semibold text-sm text-foreground text-right">{value}</div>
    </div>
);

const BillCard = ({ bill, onClick, onAction, onShare, onPrint }: { bill: StatementEntry; onClick: () => void; onAction: (action: 'pay' | 'delete', bill: StatementEntry) => void; onShare: (bill: StatementEntry) => void; onPrint: (bill: StatementEntry) => void; }) => {
    const isRent = bill.type === 'Rent';
    const amount = isRent ? bill.amount : bill.totalAmount;
    const description = isRent ? `Rent for ${bill.rentForPeriod}` : `Utilities ${bill.billingMonthBS}`;
    const Icon = isRent ? Receipt : Zap;

    return (
        <motion.div
            layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            onClick={onClick}
            className="flex items-center space-x-3 p-4 rounded-xl border bg-card cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
        >
            <div className={`p-2 rounded-full flex-shrink-0 ${bill.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 pr-1 space-y-0.5 mt-0.5">
                <p className="text-sm font-bold leading-snug line-clamp-2 break-normal">{description}</p>
                <p className="text-xs font-medium text-muted-foreground">{formatNepaliDate(bill.billDateAD)}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0 min-w-max ml-1.5 pt-0.5">
                <p className="font-bold whitespace-nowrap text-primary">Rs {amount.toLocaleString()}</p>
                
                {parseFloat(bill.paidAmount as any) > 0 && bill.status !== 'PAID' && (
                    <div className="flex flex-col items-end text-[10px] text-muted-foreground gap-0.5">
                        <p>Paid: <span className="font-semibold text-green-600">Rs {(bill.paidAmount || 0).toLocaleString()}</span></p>
                        <p>Rem: <span className="font-semibold text-red-500">Rs {(bill.remainingAmount ?? amount).toLocaleString()}</span></p>
                    </div>
                )}
                
                <div className="flex items-center justify-end gap-2 mt-1">
                    <Badge variant={bill.status === 'PAID' ? 'default' : bill.status === 'PARTIALLY_PAID' ? 'outline' : 'destructive'} className={`text-[10px] h-5 px-1.5 ${bill.status === 'PARTIALLY_PAID' ? 'border-primary text-primary' : ''}`}>{bill.status}</Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-slate-200 rounded-full" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-left rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel className="font-bold text-xs">Quick Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onPrint(bill); }}><Printer className="mr-2 h-4 w-4" /> Print Bill</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onShare(bill); }}><Share2 className="mr-2 h-4 w-4" /> Share Link</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {bill.status !== 'PAID' && <DropdownMenuItem className="cursor-pointer font-medium text-green-600 focus:text-green-700" onClick={(e) => { e.stopPropagation(); onAction('pay', bill); }}><CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Record Payment</DropdownMenuItem>}
                            <DropdownMenuItem className="cursor-pointer font-medium text-red-600 focus:text-red-700 focus:bg-red-50" onClick={(e) => { e.stopPropagation(); onAction('delete', bill); }}><Trash2 className="mr-2 h-4 w-4" /> Delete Bill</DropdownMenuItem>
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
    
    const shareText = `${desc}. ` +
        `Total: Rs ${amount.toLocaleString('en-IN')}. ` +
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
    // Inject the unpopulated tenant/room details for the print template
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
            loading: `Deleting bill...`,
            success: () => {
                mutate(); // Refresh the tenant data SWR cache
                setSelectedBill(null);
                return `Bill deleted successfully!`;
            },
            error: (err) => err.message,
        });
    }
    setConfirmation(null);
  };
  
  const handlePaymentSuccess = () => {
      setConfirmation(null);
      setSelectedBill(null); // Close the sheet to avoid stale state, or fetch individual bill again
      mutate();
  };
  
  const { filteredStatement, uniqueYears, financialSummary } = useMemo((): MemoizedData => {
    const sortedBills = [...bills].sort((a, b) => new Date(b.billDateAD).getTime() - new Date(a.billDateAD).getTime());
    const years = new Set(sortedBills.map(bill => new NepaliDate(new Date(bill.billDateAD)).getYear().toString()));
    const uniqueYears = ['all', ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
    const filtered = sortedBills.filter(bill => selectedYear === 'all' || new NepaliDate(new Date(bill.billDateAD)).getYear().toString() === selectedYear);
    const summary = filtered.reduce((acc, bill) => {
        const totalAmount = bill.type === 'Rent' ? bill.amount : bill.totalAmount;
        const paidAmount = bill.paidAmount || 0;
        const remainingAmount = bill.remainingAmount ?? (totalAmount - paidAmount);
        
        acc.totalBilled += totalAmount;
        acc.totalPaid += paidAmount;
        acc.totalDue += remainingAmount;
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
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-5 w-64" /></div></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>Could not fetch tenant details. Please check your connection and try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Drawer open={!!selectedBill} onOpenChange={(isOpen) => !isOpen && setSelectedBill(null)}>
        <DrawerContent className="p-0 outline-none pb-safe">
          {selectedBill && (
             <div className="w-full sm:max-w-md mx-auto p-5 overflow-y-auto max-h-[85vh]">
                <DrawerHeader className="mb-4 px-0 pb-0">
                    <DrawerTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
                        {selectedBill.type === 'Utility' ? <Zap className="text-primary" /> : <Receipt className="text-primary" />} {selectedBill.type} Bill
                    </DrawerTitle>
                    <DrawerDescription className="text-center mt-1 text-base">Bill for: {selectedBill.type === 'Rent' ? selectedBill.rentForPeriod : selectedBill.billingMonthBS}</DrawerDescription>
                </DrawerHeader>
                
                {/* --- Content Area --- */}
                <div className="space-y-2 mt-4 px-1">
                    <DetailRow icon={<CircleUserRound size={16} />} label="Tenant" value={tenant?.fullName ?? 'N/A'} />
                    <DetailRow icon={<Calendar size={16} />} label="Bill Date" value={formatNepaliDate(selectedBill.billDateAD)} />
                    <DetailRow icon={<Hash size={16} />} label="Status" value={<Badge variant={selectedBill.status === 'PAID' ? 'default' : selectedBill.status === 'PARTIALLY_PAID' ? 'outline' : 'destructive'} className={selectedBill.status === 'PARTIALLY_PAID' ? 'border-primary text-primary' : ''}>{selectedBill.status}</Badge>} />
                    
                    {selectedBill.type === 'Utility' && (
                        <>
                            <h4 className="font-semibold pt-4 text-primary text-sm uppercase tracking-wider">Utility Breakdown</h4>
                            <DetailRow icon={<Zap size={16} />} label="Elec. Units" value={selectedBill.electricity.unitsConsumed} />
                            <DetailRow icon={<Banknote size={16} />} label="Elec. Amount" value={`Rs ${selectedBill.electricity.amount.toLocaleString()}`} />
                            <DetailRow icon={<Droplets size={16} />} label="Water Units" value={selectedBill.water.unitsConsumed} />
                            <DetailRow icon={<Banknote size={16} />} label="Water Amount" value={`Rs ${selectedBill.water.amount.toLocaleString()}`} />
                            <h4 className="font-semibold pt-4 text-secondary text-sm uppercase tracking-wider">Other Charges</h4>
                            <DetailRow icon={<Wrench size={16} />} label="Service Charge" value={`Rs ${selectedBill.serviceCharge.toLocaleString()}`} />
                            <DetailRow icon={<Shield size={16} />} label="Security Charge" value={`Rs ${selectedBill.securityCharge.toLocaleString()}`} />
                        </>
                    )}
                    
                    <div className="pt-5">
                        <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"><FileText size={14} /> Remarks</h4>
                        <div className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-dashed italic">{selectedBill.remarks || 'No remarks provided.'}</div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-5 mt-5 border-t-2 border-primary/20">
                        <div className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Total Amount</div>
                        <div className="font-extrabold text-2xl text-primary">Rs {(selectedBill.type === 'Rent' ? selectedBill.amount : selectedBill.totalAmount).toLocaleString()}</div>
                    </div>
                    
                    {(parseFloat(selectedBill.paidAmount as any) > 0) && (
                        <div className="bg-muted/50 p-4 rounded-xl mt-4 border">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">Paid</span>
                                <span className="font-bold text-green-600 text-lg">Rs {(selectedBill.paidAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-3">
                                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(((selectedBill.paidAmount || 0) / (selectedBill.type === 'Rent' ? selectedBill.amount : selectedBill.totalAmount)) * 100, 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-muted-foreground">Remaining</span>
                                <span className="font-bold text-red-500 text-lg uppercase">Rs {(selectedBill.remainingAmount ?? (selectedBill.type === 'Rent' ? selectedBill.amount : selectedBill.totalAmount)).toLocaleString()}</span>
                            </div>
                            
                            {selectedBill.paymentHistory && selectedBill.paymentHistory.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-dashed">
                                    <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payment Tracker</h5>
                                    <div className="space-y-2">
                                        {selectedBill.paymentHistory.map((pmt: any, idx: number) => (
                                            <div key={idx} className="flex flex-row justify-between items-start text-xs bg-white/60 p-2.5 rounded-lg border shadow-sm">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <div className="font-semibold text-gray-800">{formatNepaliDate(pmt.date)}</div>
                                                    {pmt.remarks && <div className="text-[10px] text-muted-foreground italic mt-0.5 truncate">{pmt.remarks}</div>}
                                                </div>
                                                <div className="font-bold text-green-600 shrink-0">Rs {pmt.amount.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <DrawerFooter className="px-0 pt-6">
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2 font-semibold shadow-sm" onClick={() => handlePrint(selectedBill)}>
                            <Printer className="w-4 h-4" /> Print
                        </Button>
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2 font-semibold shadow-sm" onClick={() => handleShare(selectedBill)}>
                            <Share2 className="w-4 h-4" /> Share
                        </Button>
                        {selectedBill.status !== 'PAID' && (
                            <Button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm" onClick={() => setConfirmation({ action: 'pay', bill: selectedBill })}>
                                <CheckCircle2 className="w-4 h-4" /> Pay
                            </Button>
                        )}
                        <Button variant="destructive" className={`w-full flex items-center justify-center gap-2 font-bold shadow-sm ${selectedBill.status === 'PAID' ? "col-span-2" : ""}`} onClick={() => setConfirmation({ action: 'delete', bill: selectedBill })}>
                            <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                    </div>
                </DrawerFooter>
             </div>
          )}
        </DrawerContent>
      </Drawer>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="p-4 md:p-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0 rounded-full" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
                <Avatar className="h-12 w-12 border-2 border-primary"><AvatarFallback className="text-lg bg-muted">{tenant?.fullName?.split(' ').map(n=>n[0]).join('') || 'T'}</AvatarFallback></Avatar>
                <div><h1 className="text-2xl md:text-3xl font-bold leading-tight">{tenant?.fullName}</h1><p className="text-muted-foreground text-sm">Tenant Profile & Statement</p></div>
            </div>
        </div>
        
        <Card> 
          <CardHeader><CardTitle>Personal & Lease Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InfoItem icon={<Building/>} label="Room" value={roomInfo?.roomNumber} />
            <InfoItem icon={<Receipt/>} label="Monthly Rent" value={roomInfo ? `Rs ${roomInfo.rentAmount.toLocaleString()}`: 'N/A'} />
            <InfoItem icon={<Phone/>} label="Phone" value={tenant?.phoneNumber} />
            <InfoItem icon={<Calendar/>} label="Lease Ends" value={formatNepaliDate(tenant?.leaseEndDate)} />
          </CardContent>
        </Card>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<Scale className="text-red-500"/>} title="Total Due" value={financialSummary.totalDue} />
                <StatCard icon={<TrendingUp className="text-green-500"/>} title="Total Paid" value={financialSummary.totalPaid} />
                <StatCard icon={<Banknote className="text-blue-500"/>} title="Total Billed" value={financialSummary.totalBilled} />
            </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div><CardTitle>Bill Statement</CardTitle><CardDescription>A history of all bills for the selected period.</CardDescription></div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{uniqueYears.map((y: string) => <SelectItem key={y} value={y}>{y === 'all' ? 'All Years' : `${y} B.S.`}</SelectItem>)}</SelectContent>
                            </Select>
                            <Button onClick={handleDownloadCSV} variant="outline" size="icon" disabled={filteredStatement.length === 0}><Download className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isMobile ? (
                        <div className="space-y-3 pb-32">
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
                                )) : <p className="text-center text-muted-foreground py-8">No bills found for this period.</p>}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Bill Date (BS)</TableHead><TableHead className="min-w-[120px]">Details</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Remaining</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredStatement.length > 0 ? filteredStatement.map((bill: StatementEntry) => {
                                        const amount = bill.type === 'Rent' ? bill.amount : bill.totalAmount;
                                        const paid = bill.paidAmount || 0;
                                        const remaining = bill.remainingAmount ?? amount;
                                        return (
                                        <TableRow key={bill._id.toString()} onClick={() => setSelectedBill(bill)} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell><Badge variant={bill.type === 'Rent' ? 'secondary' : 'outline'}>{bill.type}</Badge></TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">{formatNepaliDate(bill.billDateAD)}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{bill.type === 'Rent' ? bill.rentForPeriod : `${bill.electricity.unitsConsumed} Units`}</TableCell>
                                            <TableCell><Badge variant={bill.status === 'PAID' ? 'default' : bill.status === 'PARTIALLY_PAID' ? 'outline' : 'destructive'} className={bill.status === 'PARTIALLY_PAID' ? 'border-primary text-primary' : ''}>{bill.status}</Badge></TableCell>
                                            <TableCell className="text-right font-mono font-semibold">Rs {amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono text-green-600 text-sm">{bill.status === 'PARTIALLY_PAID' || paid > 0 ? `Rs ${paid.toLocaleString()}` : '-'}</TableCell>
                                            <TableCell className="text-right font-mono text-red-500 font-bold text-sm">{bill.status === 'PARTIALLY_PAID' ? `Rs ${remaining.toLocaleString()}` : '-'}</TableCell>
                                            <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-slate-200 rounded-full" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 text-left rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuLabel className="font-bold text-xs">Quick Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrint(bill); }}><Printer className="mr-2 h-4 w-4" /> Print Bill</DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleShare(bill); }}><Share2 className="mr-2 h-4 w-4" /> Share Link</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {bill.status !== 'PAID' && <DropdownMenuItem className="cursor-pointer font-medium text-green-600 focus:text-green-700" onClick={(e) => { e.stopPropagation(); setConfirmation({ action: 'pay', bill }); }}><CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Record Payment</DropdownMenuItem>}
                                                    <DropdownMenuItem className="cursor-pointer font-medium text-red-600 focus:text-red-700 focus:bg-red-50" onClick={(e) => { e.stopPropagation(); setConfirmation({ action: 'delete', bill }); }}><Trash2 className="mr-2 h-4 w-4" /> Delete Bill</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    );
                                    }) : (
                                    <TableRow><TableCell colSpan={8} className="h-24 text-center">No bills found for this period.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
      </motion.div>

      <AlertDialog open={!!confirmation && confirmation.action === 'delete'} onOpenChange={() => setConfirmation(null)}>
          <AlertDialogContent className="rounded-[2rem] border-0 shadow-2xl p-6 bg-white/95 backdrop-blur-xl">
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground font-medium">
                      This action will permanently delete this bill from the statement.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 gap-2">
                  <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAction} className="rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white">
                      Confirm
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
    </>
  );
}