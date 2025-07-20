'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getPaymentColumns, PaymentData } from './columns';
import { DataTable } from '../tenants/data-table';
import { Loader2, Banknote } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<{ payment: PaymentData } | null>(null);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments');
      const responseData = await res.json();
      if (responseData.success) {
        setData(responseData.data);
      } else {
        throw new Error(responseData.message || 'Failed to fetch payments.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVerify = async () => {
    if (!confirmation) return;
    const { payment } = confirmation;

    const promise = fetch(`/api/payments/${payment._id}/verify`, {
        method: 'PATCH',
    }).then(res => {
        if (!res.ok) throw new Error(`Failed to verify payment.`);
        return res.json();
    });

    toast.promise(promise, {
        loading: 'Verifying payment...',
        success: 'Payment verified successfully!',
        error: 'Failed to verify payment.',
    });

    await promise;
    setConfirmation(null);
    fetchPayments(); // Refresh the data to remove the verified payment from the list
  };

  const columns = useMemo(() => getPaymentColumns(
    (payment) => setConfirmation({ payment })
  ), []);

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Banknote className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Pending Payments</h1>
              <p className="text-muted-foreground">Review and verify payments submitted by tenants.</p>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="relative">
            <DataTable 
                columns={columns} 
                data={data}
                filterColumnId="tenantName"
                filterPlaceholder="Filter by tenant..."
            />
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmation} onOpenChange={() => setConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify this payment of Rs {confirmation?.payment.amount.toLocaleString()} for {confirmation?.payment.tenantId.fullName}? This will mark all their due bills as PAID.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerify} className="bg-green-600 hover:bg-green-700">Verify</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}