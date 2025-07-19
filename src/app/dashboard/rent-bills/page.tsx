'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getRentBillColumns, RentBillData } from './columns';
import { DataTable } from '../tenants/data-table';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AddRentBillForm } from './add-rent-bill-form';
import { toast } from 'react-hot-toast';

export default function RentBillsPage() {
  const [data, setData] = useState<RentBillData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ action: 'pay' | 'delete'; bill: RentBillData; } | null>(null);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch('/api/rent-bills');
    const billData = await res.json();
    if (billData.success) setData(billData.data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleAction = async () => {
    if (!confirmation) return;
    const { action, bill } = confirmation;
    const url = `/api/rent-bills/${bill._id}`;
    const method = action === 'pay' ? 'PATCH' : 'DELETE';
    const promise = fetch(url, { method }).then(res => {
        if (!res.ok) throw new Error(`Failed to ${action} bill.`);
        return res.json();
    });
    toast.promise(promise, {
        loading: `${action === 'pay' ? 'Paying' : 'Deleting'} bill...`,
        success: `Bill ${action === 'pay' ? 'paid' : 'deleted'} successfully!`,
        error: `Failed to ${action} bill.`,
    });
    await promise;
    setConfirmation(null);
    fetchBills();
  };

  const columns = useMemo(() => getRentBillColumns(
    (action, bill) => setConfirmation({ action, bill })
  ), []);

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Rent Bills</h1>
            <p className="text-muted-foreground">Create and manage rent bills for all tenants.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild><Button>Add Rent Bill</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>Add Rent Bill</DialogTitle><DialogDescription>Select a tenant and enter the bill details.</DialogDescription></DialogHeader>
              <AddRentBillForm onSuccess={() => { setAddDialogOpen(false); fetchBills(); }} />
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>) : (
            <DataTable 
                columns={columns} 
                data={data}
                filterColumnId="tenantName"
                filterPlaceholder="Filter by tenant..."
            />
        )}
      </div>
      <AlertDialog open={!!confirmation} onOpenChange={() => setConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action will permanently {confirmation?.action === 'pay' ? 'mark this bill as PAID' : 'delete this bill'}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
