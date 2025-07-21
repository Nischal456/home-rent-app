'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, FileClock, AlertTriangle, CheckCircle, Hourglass, ListX } from 'lucide-react';
import { IRentBill, IUtilityBill } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type CombinedBill = (IRentBill | IUtilityBill) & { type: 'Rent' | 'Utility' };
type Status = 'DUE' | 'PAID' | 'OVERDUE';

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

// ✅ FIX: The logic for a mobile bill card has been extracted into its own component.
// This simplifies the main component and resolves the "red line on div" error.
const BillCard = ({ bill, index }: { bill: CombinedBill, index: number }) => {
  const amount = (bill as IRentBill).amount ?? (bill as IUtilityBill).totalAmount;
  const period = (bill as IRentBill).rentForPeriod ?? (bill as IUtilityBill).billingMonthBS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-white/80 backdrop-blur-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{bill.type} Bill</CardTitle>
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


// --- Main Statement Page Component ---
export default function StatementPage() {
  const [bills, setBills] = useState<CombinedBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rentRes, utilityRes] = await Promise.all([
        fetch('/api/my-bills/rent'),
        fetch('/api/my-bills/utility'),
      ]);
      const rentData = await rentRes.json();
      const utilityData = await utilityRes.json();

      const combined: CombinedBill[] = [];
      if (rentData.success) {
        rentData.data.forEach((bill: IRentBill) => combined.push({ ...bill, type: 'Rent' }));
      }
      if (utilityData.success) {
        utilityData.data.forEach((bill: IUtilityBill) => combined.push({ ...bill, type: 'Utility' }));
      }
      
      combined.sort((a, b) => new Date(b.billDateAD).getTime() - new Date(a.billDateAD).getTime());
      setBills(combined);
    } catch (error) {
      console.error("Failed to fetch statement", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your statement...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <FileClock className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">My Statement</h1>
          <p className="text-muted-foreground">A complete history of all your bills.</p>
        </div>
      </div>

      {/* --- Desktop View: Table --- */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
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
              {bills.length > 0 ? (
                bills.map(bill => (
                    <TableRow key={bill._id.toString()}>
                      <TableCell><Badge variant="secondary" className="font-semibold">{bill.type}</Badge></TableCell>
                      <TableCell>{bill.billDateBS || new NepaliDate(bill.billDateAD).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{(bill as IRentBill).rentForPeriod || (bill as IUtilityBill).billingMonthBS}</TableCell>
                      <TableCell><StatusBadge status={bill.status} /></TableCell>
                      <TableCell>{bill.paidOnBS || '---'}</TableCell>
                      <TableCell className="text-right font-medium font-mono">Rs {(bill as IRentBill).amount?.toLocaleString() || (bill as IUtilityBill).totalAmount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ListX className="h-10 w-10" />
                        <span className="font-semibold">No Bills Found</span>
                        <p>Your statement history will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- Mobile View: Cards --- */}
      <div className="md:hidden space-y-4">
        {bills.length > 0 ? (
          bills.map((bill, index) => (
            <BillCard key={bill._id.toString()} bill={bill} index={index} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground h-48">
              <ListX className="h-10 w-10" />
              <span className="font-semibold">No Bills Found</span>
              <p>Your statement history will appear here.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}