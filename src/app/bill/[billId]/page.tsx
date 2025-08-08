'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { IRentBill, IUtilityBill, IUser, IRoom } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// ✅ FIX: Define the bill data type as a proper discriminated union.
// This tells TypeScript that if type is 'Rent', it has IRentBill properties,
// and if type is 'Utility', it has IUtilityBill properties.
type PopulatedRentBill = IRentBill & { type: 'Rent'; tenantId: IUser; roomId: IRoom; };
type PopulatedUtilityBill = IUtilityBill & { type: 'Utility'; tenantId: IUser; roomId: IRoom; };
type BillData = PopulatedRentBill | PopulatedUtilityBill;

const DetailRow = ({ label, value }: { label: string, value: string | number }) => (
  <div className="flex justify-between items-center py-2 border-b">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-semibold text-sm">{value}</p>
  </div>
);

export default function PublicBillPage() {
  const params = useParams();
  const billId = params.billId as string;
  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!billId) return;
    const fetchBill = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/bills/${billId}`);
        if (!res.ok) throw new Error('Bill not found or an error occurred.');
        const result = await res.json();
        if (result.success) {
          setBill(result.data);
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [billId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8"><Skeleton className="h-96 w-full max-w-2xl" /></div>;
  }

  if (error || !bill) {
    return (
        <div className="p-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || 'Could not load bill details.'}</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center bg-muted/50 p-6 rounded-t-lg">
          <CardTitle className="text-2xl">Bill Receipt</CardTitle>
          <CardDescription>STG Tower Management</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Billed To:</h3>
              <p>{bill.tenantId.fullName}</p>
              <p>Room: {bill.roomId.roomNumber}</p>
            </div>
            <div className="text-right">
              <h3 className="font-semibold mb-1">Bill Details:</h3>
              <p>Date: {new NepaliDate(new Date(bill.billDateAD)).format('YYYY MMMM DD')}</p>
              {/* ✅ FIX: TypeScript now understands this conditional access is safe */}
              <p>For: {bill.type === 'Utility' ? bill.billingMonthBS : bill.rentForPeriod}</p>
            </div>
          </div>
          <div className="pt-4">
            <h3 className="font-semibold mb-2 text-center">Payment Summary</h3>
            {/* ✅ FIX: Use the 'type' property to conditionally render the correct bill details */}
            {bill.type === 'Utility' ? (
              <>
                <DetailRow label="Electricity Amount" value={`Rs ${bill.electricity.amount.toLocaleString()}`} />
                <DetailRow label="Water Amount" value={`Rs ${bill.water.amount.toLocaleString()}`} />
                <DetailRow label="Service Charge" value={`Rs ${bill.serviceCharge.toLocaleString()}`} />
                <DetailRow label="Security Charge" value={`Rs ${bill.securityCharge.toLocaleString()}`} />
              </>
            ) : (
              <DetailRow label="Rent Amount" value={`Rs ${bill.amount.toLocaleString()}`} />
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 rounded-b-lg flex justify-between items-center">
          <Badge variant={bill.status === 'PAID' ? 'default' : 'destructive'}>{bill.status}</Badge>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            {/* ✅ FIX: TypeScript knows which amount property to use based on the 'type' */}
            <p className="text-2xl font-bold text-primary">Rs {(bill.type === 'Utility' ? bill.totalAmount : bill.amount).toLocaleString()}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}