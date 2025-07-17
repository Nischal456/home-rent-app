'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getTenantColumns, Tenant } from './columns';
import { DataTable } from './data-table';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AddTenantForm } from './add-tenant-form';
import { AssignRoomForm } from './assign-room-form';
import { toast } from 'react-hot-toast';

export default function TenantsPage() {
  const [data, setData] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [assignRoomTenant, setAssignRoomTenant] = useState<Tenant | null>(null);
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);

  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch('/api/tenants');
    const tenantData = await res.json();
    if (tenantData.success) setData(tenantData.data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);
  
  const handleDelete = async () => {
    if (!deleteTenant) return;
    const promise = fetch(`/api/tenants/${deleteTenant._id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error('Failed to delete tenant.');
        return res.json();
    });
    toast.promise(promise, {
        loading: 'Deleting tenant...',
        success: 'Tenant deleted successfully!',
        error: 'Failed to delete tenant.',
    });
    await promise;
    setDeleteTenant(null);
    fetchTenants();
  };

  const columns = useMemo(() => getTenantColumns(
    (tenant) => setAssignRoomTenant(tenant),
    (tenant) => setDeleteTenant(tenant)
  ), []);

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tenants</h1>
            <p className="text-muted-foreground">Manage all the tenants in your property.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild><Button>Add New Tenant</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>Add New Tenant</DialogTitle><DialogDescription>Fill in the details below to add a new tenant.</DialogDescription></DialogHeader>
              <AddTenantForm onSuccess={() => { setAddDialogOpen(false); fetchTenants(); }} />
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data}
            filterColumnId="fullName"
            filterPlaceholder="Filter by name..."
          />
        )}

        <Dialog open={!!assignRoomTenant} onOpenChange={() => setAssignRoomTenant(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Assign Room</DialogTitle><DialogDescription>Select a vacant room to assign to the tenant.</DialogDescription></DialogHeader>
            {assignRoomTenant && <AssignRoomForm tenant={assignRoomTenant} onSuccess={() => { setAssignRoomTenant(null); fetchTenants(); }} />}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTenant} onOpenChange={() => setDeleteTenant(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete <span className="font-semibold">{deleteTenant?.fullName}</span> and all associated data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}