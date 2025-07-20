'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getMaintenanceColumns, MaintenanceData } from './columns';
import { DataTable } from '../tenants/data-table';
import { Loader2, Wrench } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';

type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export default function MaintenancePage() {
  const [data, setData] = useState<MaintenanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<{ request: MaintenanceData; status: Status } | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/maintenance');
      const responseData = await res.json();
      if (responseData.success) {
        setData(responseData.data);
      } else {
        throw new Error(responseData.message || 'Failed to fetch data.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = async () => {
    if (!confirmation) return;
    const { request, status } = confirmation;

    const promise = fetch(`/api/maintenance/${request._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    }).then(res => {
        if (!res.ok) throw new Error(`Failed to update status.`);
        return res.json();
    });

    toast.promise(promise, {
        loading: 'Updating status...',
        success: 'Status updated successfully!',
        error: 'Failed to update status.',
    });

    await promise;
    setConfirmation(null);
    fetchRequests(); // Refresh the data
  };

  const columns = useMemo(() => getMaintenanceColumns(
    (request, status) => setConfirmation({ request, status })
  ), []);

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Maintenance Requests</h1>
              <p className="text-muted-foreground">View and manage all tenant maintenance requests.</p>
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the status of the request for "{(confirmation?.request.issue)}" to "{confirmation?.status.replace('_', ' ')}". The tenant will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}