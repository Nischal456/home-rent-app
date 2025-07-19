'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, FileClock } from 'lucide-react';
import { IRentBill, IUtilityBill } from '@/types';
import NepaliDate from 'nepali-date-converter';

type CombinedBill = (IRentBill | IUtilityBill) & { type: 'Rent' | 'Utility' };

const getStatusBadge = (status: 'DUE' | 'PAID' | 'OVERDUE') => {
    const variants = {
        PAID: "bg-green-100 text-green-800 border-green-200",
        DUE: "bg-yellow-100 text-yellow-800 border-yellow-200",
        OVERDUE: "bg-red-100 text-red-800 border-red-200",
    };
    return <Badge variant="outline" className={`capitalize ${variants[status] || "bg-gray-100"}`}>{status}</Badge>;
};

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <FileClock className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">My Statement</h1>
          <p className="text-muted-foreground">A complete history of all your bills and payments.</p>
        </div>
      </div>
      <Card>
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
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                ) : bills.length > 0 ? (
                  bills.map(bill => (
                    <TableRow key={bill._id}>
                      <TableCell><Badge variant="secondary">{bill.type}</Badge></TableCell>
                      <TableCell>{new NepaliDate(bill.billDateAD).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{(bill as IRentBill).rentForPeriod || (bill as IUtilityBill).billingMonthBS}</TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell>{bill.paidOnBS || '---'}</TableCell>
                      <TableCell className="text-right font-medium">Rs {(bill as IRentBill).amount?.toLocaleString() || (bill as IUtilityBill).totalAmount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center">No bills found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}