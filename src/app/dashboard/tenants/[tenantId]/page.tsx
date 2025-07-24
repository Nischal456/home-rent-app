'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { motion } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';

// --- UI Components & Icons ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
    Loader2, User, Building, Receipt, Zap, Calendar, Phone, Mail, AlertCircle, Download, ArrowLeft,
    IndianRupee, Hash, CircleUserRound, TrendingUp, TrendingDown, Scale, Droplets, Wrench, Shield
} from 'lucide-react';

// --- Types ---
import { IRentBill, IUtilityBill, IUser, IRoom } from '@/types';

type StatementEntry = (IRentBill & { type: 'Rent' }) | (IUtilityBill & { type: 'Utility' });

// --- Helper Functions & Components for a Professional Look ---

const formatNepaliDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    // As of Thursday, July 24, 2025, this will correctly format the date in Bikram Sambat.
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

const StatCard = ({ icon, title, value, isCurrency = true }: { icon: React.ReactNode, title: string, value: number, isCurrency?: boolean }) => (
    <Card className="hover:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
                {isCurrency ? `Rs ${value.toLocaleString('en-IN')}` : value}
            </div>
        </CardContent>
    </Card>
);

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border/50">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">{icon}<span>{label}</span></div>
      <div className="font-semibold text-sm text-foreground">{value}</div>
    </div>
);


// --- THE MAIN PAGE COMPONENT ---
export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;

  const [tenant, setTenant] = useState<IUser | null>(null);
  const [bills, setBills] = useState<StatementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<StatementEntry | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  useEffect(() => {
    if (!tenantId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/tenants/${tenantId}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        const { data } = await res.json();
        setTenant(data.tenantDetails);
        const rentEntries: StatementEntry[] = data.rentBills.map((b: IRentBill) => ({ ...b, type: 'Rent' }));
        const utilityEntries: StatementEntry[] = data.utilityBills.map((b: IUtilityBill) => ({ ...b, type: 'Utility' }));
        setBills([...rentEntries, ...utilityEntries]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenantId]);
  
  const { filteredStatement, uniqueYears, financialSummary } = useMemo(() => {
    const sortedBills = bills.sort((a, b) => new Date(b.billDateAD).getTime() - new Date(a.billDateAD).getTime());
    
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
            'Elec Units': isUtility ? bill.electricity.unitsConsumed : 'N/A', 'Elec Amount': isUtility ? bill.electricity.amount : 'N/A',
            'Water Units': isUtility ? bill.water.unitsConsumed : 'N/A', 'Water Amount': isUtility ? bill.water.amount : 'N/A',
            'Service Charge': isUtility ? bill.serviceCharge : 'N/A', 'Security Charge': isUtility ? bill.securityCharge : 'N/A',
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

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-5 w-64" /></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        <Skeleton className="h-96" />
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
                        {selectedBill.type === 'Utility' ? <Zap /> : <Receipt />}
                        {selectedBill.type} Bill Details
                    </SheetTitle>
                    <SheetDescription>
                        Bill for: {selectedBill.type === 'Rent' ? selectedBill.rentForPeriod : selectedBill.billingMonthBS}
                    </SheetDescription>
                </SheetHeader>
                <div className="space-y-2">
                    <DetailRow icon={<CircleUserRound size={16} />} label="Tenant" value={tenant?.fullName ?? 'N/A'} />
                    <DetailRow icon={<Calendar size={16} />} label="Bill Date (BS)" value={formatNepaliDate(selectedBill.billDateAD)} />
                    <DetailRow icon={<Hash size={16} />} label="Status" value={<Badge variant={selectedBill.status === 'PAID' ? 'default' : 'destructive'}>{selectedBill.status}</Badge>} />
                    
                    {selectedBill.type === 'Utility' && (
                        <>
                            <h4 className="font-semibold pt-4 text-primary">Utility Breakdown</h4>
                            <DetailRow icon={<Zap size={16} />} label="Elec. Units Consumed" value={selectedBill.electricity.unitsConsumed} />
                            <DetailRow icon={<IndianRupee size={16} />} label="Elec. Amount" value={`Rs ${selectedBill.electricity.amount.toLocaleString()}`} />
                            <DetailRow icon={<Droplets size={16} />} label="Water Units Consumed" value={selectedBill.water.unitsConsumed} />
                            <DetailRow icon={<IndianRupee size={16} />} label="Water Amount" value={`Rs ${selectedBill.water.amount.toLocaleString()}`} />
                            <h4 className="font-semibold pt-4 text-primary">Other Charges</h4>
                            <DetailRow icon={<Wrench size={16} />} label="Service Charge" value={`Rs ${selectedBill.serviceCharge.toLocaleString()}`} />
                            <DetailRow icon={<Shield size={16} />} label="Security Charge" value={`Rs ${selectedBill.securityCharge.toLocaleString()}`} />
                        </>
                    )}
                    
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
                <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0 rounded-full" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarFallback className="text-lg bg-muted">{tenant?.fullName.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold leading-tight">{tenant?.fullName}</h1>
                    <p className="text-muted-foreground text-sm">Tenant Profile & Statement</p>
                </div>
            </div>
        </div>

        {/* ✅ THIS CARD WAS THE SOURCE OF THE PREVIOUS TYPO. IT IS NOW CORRECTED. */}
        <Card> 
          <CardHeader><CardTitle>Personal & Lease Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoItem icon={<Building/>} label="Room" value={roomInfo?.roomNumber} />
            <InfoItem icon={<Receipt/>} label="Monthly Rent" value={`Rs ${roomInfo?.rentAmount.toLocaleString()}`} />
            <InfoItem icon={<Phone/>} label="Phone" value={tenant?.phoneNumber} />
            <InfoItem icon={<Calendar/>} label="Lease Ends" value={formatNepaliDate(tenant?.leaseEndDate)} />
          </CardContent>
        </Card>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<Scale className="text-red-500"/>} title="Total Due" value={financialSummary.totalDue} />
                <StatCard icon={<TrendingUp className="text-green-500"/>} title="Total Paid" value={financialSummary.totalPaid} />
                <StatCard icon={<IndianRupee className="text-blue-500"/>} title="Total Billed" value={financialSummary.totalBilled} />
            </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Bill Statement</CardTitle>
                            <CardDescription>A history of all bills for the selected period.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{uniqueYears.map(y => <SelectItem key={y} value={y}>{y === 'all' ? 'All Years' : `${y} B.S.`}</SelectItem>)}</SelectContent>
                            </Select>
                            <Button onClick={handleDownloadCSV} variant="outline" size="icon" disabled={filteredStatement.length === 0}>
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Bill Date (BS)</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStatement.length > 0 ? filteredStatement.map(bill => (
                                <TableRow key={`${bill.type}-${bill._id.toString()}`} onClick={() => setSelectedBill(bill)} className="cursor-pointer hover:bg-muted/50">
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
                </CardContent>
            </Card>
        </motion.div>
      </motion.div>
    </>
  );
}