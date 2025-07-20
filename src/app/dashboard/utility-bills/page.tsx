'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getUtilityBillColumns, UtilityBillData } from './columns';
import { DataTable } from '../tenants/data-table';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AddUtilityBillForm } from './add-utility-bill-form';
import { toast } from 'react-hot-toast';

export default function UtilityBillsPage() {
  const [data, setData] = useState<UtilityBillData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ action: 'pay' | 'delete'; bill: UtilityBillData; } | null>(null);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch('/api/utility-bills');
    const billData = await res.json();
    if (billData.success) setData(billData.data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleAction = async () => {
    if (!confirmation) return;
    const { action, bill } = confirmation;
    const url = `/api/utility-bills/${bill._id}`;
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
  
  const columns = useMemo(() => getUtilityBillColumns(
    (action, bill) => setConfirmation({ action, bill })
  ), [fetchBills]); // Added fetchBills to dependency array for correctness

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Utility Bills</h1>
            <p className="text-muted-foreground">Create and manage monthly utility bills.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild><Button>Add Utility Bill</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Add Utility Bill</DialogTitle><DialogDescription>Enter meter readings and charges for a tenant.</DialogDescription></DialogHeader>
              <AddUtilityBillForm onSuccess={() => { setAddDialogOpen(false); fetchBills(); }} />
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>) : (
            // ✅ FIX: Wrapped DataTable in a div to fix dropdown positioning
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