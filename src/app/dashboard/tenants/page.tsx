'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getTenantColumns, Tenant } from './columns'; // Ensure this path is correct
import { DataTable } from './data-table'; // Your existing DataTable component
import { AddTenantForm } from './add-tenant-form'; // Your existing form
import { AssignRoomForm } from './assign-room-form'; // Your existing form
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';

export default function TenantsPage() {
  // State for data, loading, errors, and dialogs
  const [data, setData] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to manage dialog visibility
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [assignRoomTenant, setAssignRoomTenant] = useState<Tenant | null>(null);
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);

  // Fetches all tenants from the API, with error handling
  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tenants');
      if (!res.ok) {
        throw new Error('Failed to fetch tenants. Please try again later.');
      }
      const tenantData = await res.json();
      if (tenantData.success) {
        setData(tenantData.data);
      } else {
        throw new Error(tenantData.message || 'An unknown error occurred.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Handles the delete action with optimistic UI
  const handleDelete = async () => {
    if (!deleteTenant) return;

    const originalData = [...data];
    // Optimistically update the UI by removing the tenant immediately
    setData(currentData => currentData.filter(t => t._id !== deleteTenant._id));
    setDeleteTenant(null); // Close the dialog immediately

    try {
      const res = await fetch(`/api/tenants/${deleteTenant._id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Server error. Failed to delete.');
      }
      toast.success(`Tenant "${deleteTenant.fullName}" deleted successfully!`);
      // No need to call fetchTenants() on success as the UI is already updated
    } catch (err) {
      toast.error(`Failed to delete "${deleteTenant.fullName}". Restoring data.`);
      // If the delete fails, revert the UI to its original state
      setData(originalData);
    }
  };

  // Memoize columns to prevent re-creation on every render
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
            <DialogTrigger asChild>
              <Button>Add New Tenant</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
                <DialogDescription>Fill in the details below to add a new tenant.</DialogDescription>
              </DialogHeader>
              <AddTenantForm onSuccess={() => { setAddDialogOpen(false); fetchTenants(); }} />
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Conditional Rendering for Loading, Error, and Data States */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="text-red-500 bg-red-50 p-4 rounded-md flex items-center gap-3"><AlertCircle className="h-5 w-5" /> {error}</div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data}
            filterColumnId="fullName"
            filterPlaceholder="Filter by name..."
          />
        )}
      </div>

      {/* Dialog for Assigning a Room */}
      <Dialog open={!!assignRoomTenant} onOpenChange={() => setAssignRoomTenant(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Room to {assignRoomTenant?.fullName}</DialogTitle>
            <DialogDescription>Select a vacant room to assign to the tenant.</DialogDescription>
          </DialogHeader>
          {assignRoomTenant && <AssignRoomForm tenant={assignRoomTenant} onSuccess={() => { setAssignRoomTenant(null); fetchTenants(); }} />}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={!!deleteTenant} onOpenChange={() => setDeleteTenant(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete <span className="font-semibold">{deleteTenant?.fullName}</span> and all associated data. This action cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}