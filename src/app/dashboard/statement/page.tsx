'use client';

import { useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, FileClock, AlertTriangle, CheckCircle, Hourglass, ListX, X, Download,TrendingUp } from 'lucide-react';
import { IRentBill, IUtilityBill, IUser } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMediaQuery } from 'usehooks-ts';
import Papa from 'papaparse';

// --- NEW IMPORTS for the "Best of Best" Pop-up ---
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Receipt, Zap, Calendar, Hash, CircleUserRound, Banknote, Droplets, Wrench, Shield, FileText, Scale } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

type CombinedBill = (IRentBill & { type: 'Rent' }) | (IUtilityBill & { type: 'Utility' });
type Status = 'DUE' | 'PAID' | 'OVERDUE';

// --- Reusable SWR fetcher function ---
const fetcher = (url: string) => fetch(url).then(res => res.json());

// --- Reusable Sub-Components ---
const StatusBadge = ({ status }: { status: Status }) => {
    const statusConfig: Record<Status, { text: string; icon: ReactNode; className: string }> = {
        PAID: { text: "Paid", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-green-100/80 text-green-900 border-green-300" },
        DUE: { text: "Due", icon: <Hourglass className="h-3.5 w-3.5" />, className: "bg-yellow-100/80 text-yellow-900 border-yellow-300" },
        OVERDUE: { text: "Overdue", icon: <AlertTriangle className="h-3.5 w-3.5" />, className: "bg-red-100/80 text-red-900 border-red-300" },
    };
    const config = statusConfig[status] || { text: status, icon: null, className: "bg-gray-100/80 text-gray-900" };

    return <Badge variant="outline" className={cn("inline-flex items-center gap-1.5 font-semibold", config.className)}>{config.icon}<span>{config.text}</span></Badge>;
};

const StatCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: number }) => (
    <Card className="bg-white/80 backdrop-blur-xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">Rs {value.toLocaleString('en-IN')}</div>
        </CardContent>
    </Card>
);

const BillCard = ({ bill, index, onClick }: { bill: CombinedBill, index: number, onClick: () => void }) => {
  const amount = bill.type === 'Rent' ? bill.amount : bill.totalAmount;
  const period = bill.type === 'Rent' ? bill.rentForPeriod : bill.billingMonthBS;
  const Icon = bill.type === 'Rent' ? Receipt : Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-white/80 backdrop-blur-xl cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2"><Icon className="h-5 w-5" /> {bill.type} Bill</CardTitle>
              <CardDescription>{period}</CardDescription>
            </div>
            <div className="text-lg font-bold text-primary font-mono">
              Rs {amount.toLocaleString()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bill Date:</span>
            <span className="font-medium">{bill.billDateBS || new NepaliDate(bill.billDateAD).format('YYYY-MM-DD')}</span>
          </div>
           <div className="flex justify-between">
            <span className="text-muted-foreground">Paid On:</span>
            <span className="font-medium">{bill.paidOnBS || '---'}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-muted-foreground">Status:</span>
            <StatusBadge status={bill.status} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- "BEST OF BEST" RESPONSIVE BILL DETAILS POP-UP ---

// ✅ DEFINITIVE FIX 1: A new robust DetailRow component that handles overflow
const DetailRow = ({ icon, label, value, isTotal = false }: { icon: React.ReactNode, label: string, value: React.ReactNode, isTotal?: boolean }) => (
    <div className={cn(
        "grid grid-cols-2 items-start py-3 border-b border-border/50",
        isTotal && "border-t-2 border-b-0 pt-4 mt-2"
    )}>
      <div className="flex items-center gap-3 text-sm text-muted-foreground truncate">
        {icon}
        <span className={cn("truncate", isTotal && "text-lg font-bold text-foreground")}>{label}</span>
      </div>
      <div className={cn(
          "font-semibold text-sm text-foreground text-right break-words",
          isTotal && "text-2xl font-extrabold text-primary"
      )}>
        {value}
      </div>
    </div>
);

// ✅ DEFINITIVE FIX 2: A dedicated, professional component for Rent Details
const RentDetails = ({ bill }: { bill: IRentBill }) => (
  <div className="space-y-2">
    <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2"><Receipt size={14} /> RENT DETAILS</h4>
    <div className="border-l-2 pl-4 space-y-1">
      <DetailRow icon={<span className="w-4"/>} label="Rent for Period" value={bill.rentForPeriod} />
      <DetailRow icon={<Banknote size={16} />} label="Amount" value={`Rs ${bill.amount.toLocaleString()}`} />
    </div>
  </div>
);

const UtilityDetails = ({ bill }: { bill: IUtilityBill }) => (
  <div className="space-y-6">
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2"><Zap size={14} /> ELECTRICITY</h4>
      <div className="border-l-2 pl-4 space-y-1">
        <DetailRow icon={<span className="w-4"/>} label="Previous Reading" value={bill.electricity.previousReading} />
        <DetailRow icon={<span className="w-4"/>} label="Current Reading" value={bill.electricity.currentReading} />
        <DetailRow icon={<span className="w-4"/>} label="Units Consumed" value={bill.electricity.unitsConsumed} />
        <DetailRow icon={<Banknote size={16} />} label="Amount" value={`Rs ${bill.electricity.amount.toLocaleString()}`} />
      </div>
    </div>
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2"><Droplets size={14} /> WATER</h4>
      <div className="border-l-2 pl-4 space-y-1">
        <DetailRow icon={<span className="w-4"/>} label="Previous Reading" value={bill.water.previousReading} />
        <DetailRow icon={<span className="w-4"/>} label="Current Reading" value={bill.water.currentReading} />
        <DetailRow icon={<span className="w-4"/>} label="Units Consumed" value={bill.water.unitsConsumed} />
        <DetailRow icon={<Banknote size={16} />} label="Amount" value={`Rs ${bill.water.amount.toLocaleString()}`} />
      </div>
    </div>
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2"><Wrench size={14} /> OTHER CHARGES</h4>
       <div className="border-l-2 pl-4 space-y-1">
        <DetailRow icon={<span className="w-4"/>} label="Service Charge" value={`Rs ${bill.serviceCharge.toLocaleString()}`} />
        <DetailRow icon={<Shield size={16} />} label="Security Charge" value={`Rs ${bill.securityCharge.toLocaleString()}`} />
      </div>
    </div>
  </div>
);

const BillContent = ({ bill, user }: { bill: CombinedBill, user: IUser | null }) => {
  const isUtility = bill.type === 'Utility';
  const totalAmount = isUtility ? (bill as IUtilityBill).totalAmount : (bill as IRentBill).amount;

  return (
    <div className="p-4 sm:p-0">
      <div className="grid gap-6">
        <div className="grid gap-1 p-4 rounded-lg bg-muted/50">
           <DetailRow icon={<CircleUserRound size={16} />} label="Tenant" value={user?.fullName ?? 'N/A'} />
           <DetailRow icon={<Calendar size={16} />} label="Bill Date (BS)" value={new NepaliDate(bill.billDateAD).format('YYYY MMMM DD')} />
           <DetailRow icon={<Hash size={16} />} label="Status" value={<StatusBadge status={bill.status} />} />
        </div>
        
        {isUtility ? (
          <UtilityDetails bill={bill as IUtilityBill} />
        ) : (
          <RentDetails bill={bill as IRentBill} /> // ✅ Use the new rent component
        )}

        <div className="pt-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2"><FileText size={14} /> REMARKS</h4>
            <div className="text-sm text-foreground bg-muted/50 p-3 rounded-md border italic break-words">
                {bill.remarks && bill.remarks.trim() !== '' ? bill.remarks : 'No remarks provided for this bill.'}
            </div>
        </div>
        
        {/* ✅ DEFINITIVE FIX 3: Use the robust DetailRow for the Grand Total */}
        <DetailRow
            isTotal={true}
            icon={<Scale size={16} />}
            label="Grand Total"
            value={`Rs ${totalAmount.toLocaleString()}`}
        />
      </div>
    </div>
  );
};

function StatementBillDetails({ bill, user, onClose }: { bill: CombinedBill | null, user: IUser | null, onClose: () => void }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (!bill) return null;
  
  const isUtility = bill.type === 'Utility';
  const title = `${bill.type} Bill Details`;
  const description = `Bill for: ${isUtility ? (bill as IUtilityBill).billingMonthBS : (bill as IRentBill).rentForPeriod}`;

  if (isDesktop) {
    return (
      <Dialog open={!!bill} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{isUtility ? <Zap size={18} /> : <Receipt size={18} />} {title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <BillContent bill={bill} user={user} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={!!bill} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">{isUtility ? <Zap size={18} /> : <Receipt size={18} />} {title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 overflow-y-auto max-h-[70vh]">
          <BillContent bill={bill} user={user} />
        </div>
        <DrawerFooter className="pt-4">
          <DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose>
        </DrawerFooter>
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
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

// --- Main Statement Page Component ---
export default function StatementPage() {
  const [selectedBill, setSelectedBill] = useState<CombinedBill | null>(null);
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
    return <div className="p-4 md:p-8"><LoadingSkeleton /></div>;
  }

  return (
    <>
      <StatementBillDetails bill={selectedBill} user={user} onClose={() => setSelectedBill(null)} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <FileClock className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">My Statement</h1>
              <p className="text-muted-foreground">A complete history of all your bills.</p>
            </div>
          </div>
          <Button onClick={handleDownloadCSV} variant="outline" className="w-full md:w-auto">
            <Download className="mr-2 h-4 w-4" /> Download CSV
          </Button>
        </div>

        {isMobile && (
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-primary-foreground shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm">Total Outstanding Due</p>
              <p className="text-2xl font-bold">Rs {totalDue.toLocaleString()}</p>
            </CardContent>
          </Card>
        )}
        
        {!isMobile && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }} 
               transition={{ delay: 0.1 }}
               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
             >
                <StatCard icon={<Scale className="text-red-500"/>} title="Total Due" value={totalDue} />
                <StatCard icon={<TrendingUp className="text-green-500"/>} title="Total Paid" value={totalPaid} />
                <StatCard icon={<Banknote className="text-blue-500"/>} title="Total Billed" value={totalBilled} />
            </motion.div>
        )}

        <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Bill Date (B.S.)</TableHead>
                    <TableHead>Period / Month</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid On (B.S.)</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBills.length > 0 ? (
                    allBills.map(bill => (
                        <TableRow key={bill._id.toString()} onClick={() => setSelectedBill(bill)} className="cursor-pointer hover:bg-muted/50">
                          <TableCell><Badge variant="secondary" className="font-semibold">{bill.type}</Badge></TableCell>
                          <TableCell>{bill.billDateBS || new NepaliDate(bill.billDateAD).format('YYYY-MM-DD')}</TableCell>
                          <TableCell>{bill.type === 'Rent' ? (bill as IRentBill).rentForPeriod : (bill as IUtilityBill).billingMonthBS}</TableCell>
                          <TableCell><StatusBadge status={bill.status} /></TableCell>
                          <TableCell>{bill.paidOnBS || '---'}</TableCell>
                          <TableCell className="text-right font-medium font-mono">Rs {bill.type === 'Rent' ? (bill as IRentBill).amount.toLocaleString() : (bill as IUtilityBill).totalAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="h-48 text-center"><div className="flex flex-col items-center justify-center gap-2 text-muted-foreground"><ListX className="h-10 w-10" /><span className="font-semibold">No Bills Found</span><p>Your statement history will appear here.</p></div></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="md:hidden space-y-4">
          {allBills.length > 0 ? (
            <AnimatePresence>
              {allBills.map((bill, index) => (
                <BillCard key={bill._id.toString()} bill={bill} index={index} onClick={() => setSelectedBill(bill)} />
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground h-48">
                <ListX className="h-10 w-10" />
                <span className="font-semibold">No Bills Found</span>
                <p>Your statement history will appear here.</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}