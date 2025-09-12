'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'usehooks-ts';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Papa from 'papaparse';

// --- UI Components & Icons ---
import { getTenantColumns, Tenant } from './columns';
import { DataTable } from './data-table';
import { AddTenantForm } from './add-tenant-form';
import { AssignRoomForm } from './assign-room-form';
import { Loader2, AlertCircle, PlusCircle, Search, Users, MoreHorizontal, Home, Trash2, UserPlus, UserCheck, BedDouble, Download, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { IRoom } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
});

// --- Reusable Sub-Components ---

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const TenantCard = ({ tenant, onAssignRoom, onDelete }: { tenant: Tenant, onAssignRoom: (tenant: Tenant) => void, onDelete: (tenant: Tenant) => void }) => {
    const room = tenant.roomId as IRoom | undefined;
    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            <Card className="overflow-hidden shadow-md">
                <CardHeader className="flex flex-row items-start gap-4 p-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/50"><AvatarFallback className="text-lg bg-muted">{tenant.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                    <div className="flex-1">
                        <Link href={`/dashboard/tenants/${tenant._id.toString()}`}><CardTitle className="text-lg hover:underline">{tenant.fullName}</CardTitle></Link>
                        <p className="text-sm text-muted-foreground">{room?.roomNumber ? `Room: ${room.roomNumber}` : 'Not Assigned'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><Phone size={12}/>{tenant.phoneNumber}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onAssignRoom(tenant)}><Home className="mr-2 h-4 w-4" />Assign Room</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(tenant)}><Trash2 className="mr-2 h-4 w-4" />Delete Tenant</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
            </Card>
        </motion.div>
    );
};

const TenantsPageSkeleton = () => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
        </div>
    </div>
);


// --- Main Page Component ---
export default function TenantsPage() {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const { mutate } = useSWRConfig();
    const apiUrl = '/api/tenants';

    const { data: apiResponse, error, isLoading } = useSWR(apiUrl, fetcher);
    const tenants: Tenant[] = apiResponse?.data ?? [];

    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [assignRoomTenant, setAssignRoomTenant] = useState<Tenant | null>(null);
    const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [assignmentFilter, setAssignmentFilter] = useState('all');

    const handleSuccess = useCallback(() => {
        setAddDialogOpen(false);
        setAssignRoomTenant(null);
        mutate(apiUrl);
    }, [mutate, apiUrl]);
    
    const handleDelete = async () => {
        if (!deleteTenant) return;
        
        const promise = fetch(`/api/tenants/${deleteTenant._id}`, { method: 'DELETE' }).then(res => {
            if (!res.ok) throw new Error('Failed to delete.');
            return res.json();
        }).then(() => {
            mutate(apiUrl, (currentData: any) => ({
                ...currentData,
                data: currentData.data.filter((t: Tenant) => t._id !== deleteTenant._id)
            }), false);
        });

        toast.promise(promise, {
            loading: `Deleting ${deleteTenant.fullName}...`,
            success: `Tenant "${deleteTenant.fullName}" deleted.`,
            error: `Failed to delete "${deleteTenant.fullName}".`,
        });

        setDeleteTenant(null);
    };
    
    const handleExportCSV = () => {
        toast.success(`Exporting ${filteredTenants.length} tenants...`);
        const csvData = filteredTenants.map(tenant => ({
            ID: tenant._id.toString(),
            FullName: tenant.fullName,
            PhoneNumber: tenant.phoneNumber,
            Email: tenant.email,
            Status: tenant.status,
            RoomNumber: (tenant.roomId as IRoom)?.roomNumber || 'N/A',
            LeaseStartDate: tenant.leaseStartDate,
            LeaseEndDate: tenant.leaseEndDate,
        }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'tenants_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = useMemo(() => getTenantColumns(setAssignRoomTenant, setDeleteTenant), []);

    const { filteredTenants, stats } = useMemo(() => {
        const stats = {
            total: tenants.length,
            active: tenants.filter(t => t.status === 'ACTIVE').length,
            occupied: tenants.filter(t => !!t.roomId).length,
        };

        const filtered = tenants.filter(tenant => {
            const searchMatch = tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase());
            const assignmentMatch = assignmentFilter === 'all' || (assignmentFilter === 'assigned' ? !!tenant.roomId : !tenant.roomId);
            return searchMatch && assignmentMatch;
        });
        
        return { filteredTenants: filtered, stats };
    }, [tenants, searchQuery, assignmentFilter]);

    if (isLoading) return <div className="container mx-auto py-10"><TenantsPageSkeleton /></div>;
    if (error) return <div className="container mx-auto py-10"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Failed to load tenants</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert></div>;

    return (
        <>
            <div className="container mx-auto py-10">
                {/* --- Header --- */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Tenants</h1>
                        <p className="text-muted-foreground">Manage your {stats.total} tenants across {stats.occupied} occupied rooms.</p>
                    </div>
                    <Button onClick={() => setAddDialogOpen(true)} className="hidden md:inline-flex"><PlusCircle className="mr-2 h-4 w-4" /> Add Tenant</Button>
                </div>

                {/* --- Dashboard Stats --- */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                    <StatCard title="Total Tenants" value={stats.total} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Active Tenants" value={stats.active} icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Rooms Occupied" value={`${stats.occupied} / ${stats.total}`} icon={<BedDouble className="h-4 w-4 text-muted-foreground" />} />
                </div>
                
                {/* --- Filters & Actions --- */}
                 {tenants.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-2 mb-6 p-4 border rounded-lg bg-card">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Search tenants by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                        <div className="flex gap-2">
                           <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by room" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Room Assignments</SelectItem><SelectItem value="assigned">Assigned</SelectItem><SelectItem value="unassigned">Unassigned</SelectItem></SelectContent>
                           </Select>
                           <Button variant="outline" onClick={handleExportCSV} className="w-full md:w-auto"><Download className="mr-2 h-4 w-4" />Export</Button>
                        </div>
                    </div>
                 )}

                {/* --- Main Content --- */}
                {filteredTenants.length === 0 && tenants.length > 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg"><h3 className="text-lg font-semibold">No tenants match your filters.</h3><p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p></div>
                ) : tenants.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg"><Users className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No Tenants Found</h3><p className="mt-1 text-sm text-muted-foreground">Get started by adding your first tenant.</p><div className="mt-6"><Button onClick={() => setAddDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Add First Tenant</Button></div></div>
                ) : isMobile ? (
                    <div className="space-y-4"><AnimatePresence>{filteredTenants.map(tenant => <TenantCard key={tenant._id.toString()} tenant={tenant} onAssignRoom={setAssignRoomTenant} onDelete={setDeleteTenant} />)}</AnimatePresence></div>
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={filteredTenants} 
                        filterColumnId="fullName"
                        filterPlaceholder="Filter by name..."
                    />
                )}
            </div>

            {/* --- Mobile FAB & Modals --- */}
            {isMobile && <Button onClick={() => setAddDialogOpen(true)} className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 flex md:hidden"><PlusCircle className="h-8 w-8" /><span className="sr-only">Add Tenant</span></Button>}
            
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}><DialogContent><DialogHeader><DialogTitle>Add New Tenant</DialogTitle><DialogDescription>Fill in the details to add a new tenant.</DialogDescription></DialogHeader><AddTenantForm onSuccess={handleSuccess} /></DialogContent></Dialog>
            <Dialog open={!!assignRoomTenant} onOpenChange={() => setAssignRoomTenant(null)}><DialogContent><DialogHeader><DialogTitle>Assign Room to {assignRoomTenant?.fullName}</DialogTitle><DialogDescription>Select a vacant room.</DialogDescription></DialogHeader>{assignRoomTenant && <AssignRoomForm tenant={assignRoomTenant} onSuccess={handleSuccess} />}</DialogContent></Dialog>
            <AlertDialog open={!!deleteTenant} onOpenChange={() => setDeleteTenant(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete <span className="font-semibold">{deleteTenant?.fullName}</span>.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </>
    );
}