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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
    Building, Receipt, Zap, Calendar, Phone, AlertCircle, Download, ArrowLeft,
    Banknote, Hash, CircleUserRound, TrendingUp, TrendingDown, Scale, Droplets, Wrench, Shield, FileText
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

const BillCard = ({ bill, onClick }: { bill: StatementEntry; onClick: () => void }) => {
    const isRent = bill.type === 'Rent';
    const amount = isRent ? bill.amount : bill.totalAmount;
    const description = isRent ? `Rent for ${bill.rentForPeriod}` : `Utilities for ${bill.billingMonthBS}`;
    const Icon = isRent ? Receipt : Zap;

    return (
        <motion.div
            layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            onClick={onClick}
            className="flex items-center space-x-4 p-4 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
        >
            <div className={`p-2 rounded-full ${bill.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{description}</p>
                <p className="text-xs text-muted-foreground">{formatNepaliDate(bill.billDateAD)}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold">Rs {amount.toLocaleString()}</p>
                <Badge variant={bill.status === 'PAID' ? 'default' : 'destructive'} className="mt-1">{bill.status}</Badge>
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

  const { data: apiResponse, error, isLoading } = useSWR(`/api/admin/tenants/${tenantId}`, fetcher, {
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
  
  const { filteredStatement, uniqueYears, financialSummary } = useMemo((): MemoizedData => {
    const sortedBills = [...bills].sort((a, b) => new Date(b.billDateAD).getTime() - new Date(a.billDateAD).getTime());
    const years = new Set(sortedBills.map(bill => new NepaliDate(new Date(bill.billDateAD)).getYear().toString()));
    const uniqueYears = ['all', ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
    const filtered = sortedBills.filter(bill => selectedYear === 'all' || new NepaliDate(new Date(bill.billDateAD)).getYear().toString() === selectedYear);
    const summary = filtered.reduce((acc, bill) => {
        const amount = bill.type === 'Rent' ? bill.amount : bill.totalAmount;
        acc.totalBilled += amount;
        if (bill.status === 'PAID') {
            acc.totalPaid += amount;
        } else {
            acc.totalDue += amount;
        }
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
      <Sheet open={!!selectedBill} onOpenChange={(isOpen) => !isOpen && setSelectedBill(null)}>
        <SheetContent className="w-full sm:max-w-lg p-6">
          {selectedBill && (
             <>
                <SheetHeader className="mb-4">
                    <SheetTitle className="flex items-center gap-3 text-2xl">
                        {selectedBill.type === 'Utility' ? <Zap /> : <Receipt />} {selectedBill.type} Bill Details
                    </SheetTitle>
                    <SheetDescription>Bill for: {selectedBill.type === 'Rent' ? selectedBill.rentForPeriod : selectedBill.billingMonthBS}</SheetDescription>
                </SheetHeader>
                <div className="space-y-2">
                    <DetailRow icon={<CircleUserRound size={16} />} label="Tenant" value={tenant?.fullName ?? 'N/A'} />
                    <DetailRow icon={<Calendar size={16} />} label="Bill Date (BS)" value={formatNepaliDate(selectedBill.billDateAD)} />
                    <DetailRow icon={<Hash size={16} />} label="Status" value={<Badge variant={selectedBill.status === 'PAID' ? 'default' : 'destructive'}>{selectedBill.status}</Badge>} />
                    {selectedBill.type === 'Utility' && (
                        <>
                            <h4 className="font-semibold pt-4 text-primary">Utility Breakdown</h4>
                            <DetailRow icon={<Zap size={16} />} label="Elec. Units Consumed" value={selectedBill.electricity.unitsConsumed} />
                            <DetailRow icon={<Banknote size={16} />} label="Elec. Amount" value={`Rs ${selectedBill.electricity.amount.toLocaleString()}`} />
                            <DetailRow icon={<Droplets size={16} />} label="Water Units Consumed" value={selectedBill.water.unitsConsumed} />
                            <DetailRow icon={<Banknote size={16} />} label="Water Amount" value={`Rs ${selectedBill.water.amount.toLocaleString()}`} />
                            <h4 className="font-semibold pt-4 text-primary">Other Charges</h4>
                            <DetailRow icon={<Wrench size={16} />} label="Service Charge" value={`Rs ${selectedBill.serviceCharge.toLocaleString()}`} />
                            <DetailRow icon={<Shield size={16} />} label="Security Charge" value={`Rs ${selectedBill.securityCharge.toLocaleString()}`} />
                        </>
                    )}
                    <div className="pt-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2"><FileText size={14} /> REMARKS</h4>
                        <div className="text-sm text-foreground bg-muted/50 p-3 rounded-md border italic">{selectedBill.remarks || 'No remarks provided.'}</div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t-2 mt-4">
                        <div className="font-bold text-base">Total Amount</div>
                        <div className="font-bold text-lg text-primary">Rs {(selectedBill.type === 'Rent' ? selectedBill.amount : selectedBill.totalAmount).toLocaleString()}</div>
                    </div>
                </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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
                        <div className="space-y-3">
                            <AnimatePresence>
                                {filteredStatement.length > 0 ? filteredStatement.map((bill: StatementEntry) => (
                                    <BillCard key={bill._id.toString()} bill={bill} onClick={() => setSelectedBill(bill)} />
                                )) : <p className="text-center text-muted-foreground py-8">No bills found for this period.</p>}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Bill Date (BS)</TableHead><TableHead>Details</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredStatement.length > 0 ? filteredStatement.map((bill: StatementEntry) => (
                                    <TableRow key={bill._id.toString()} onClick={() => setSelectedBill(bill)} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell><Badge variant={bill.type === 'Rent' ? 'secondary' : 'outline'}>{bill.type}</Badge></TableCell>
                                        <TableCell className="font-medium">{formatNepaliDate(bill.billDateAD)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{bill.type === 'Rent' ? bill.rentForPeriod : `${bill.electricity.unitsConsumed} Units`}</TableCell>
                                        <TableCell><Badge variant={bill.status === 'PAID' ? 'default' : 'destructive'}>{bill.status}</Badge></TableCell>
                                        <TableCell className="text-right font-mono">Rs {(bill.type === 'Rent' ? bill.amount : bill.totalAmount).toLocaleString()}</TableCell>
                                    </TableRow>
                                    )) : (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No bills found for this period.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
      </motion.div>
    </>
  );
}