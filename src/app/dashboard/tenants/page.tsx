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
import { Loader2, AlertCircle, PlusCircle, Search, Users, MoreHorizontal, Home, Trash2, UserPlus, UserCheck, BedDouble, Download, Phone, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const StatCardApp = ({ title, value, Icon, delay, fromColor, badgeClass, iconColor }: { title: string; value: string | number; Icon: React.ElementType; delay: number; fromColor: string; badgeClass: string; iconColor: string; }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: "easeOut" }}>
        <Card className="relative overflow-hidden border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(11,40,99,0.08)] transition-all duration-500 rounded-[2.5rem] bg-white/70 backdrop-blur-xl group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${fromColor} to-transparent opacity-40 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700 pointer-events-none -z-10`}></div>
            <CardContent className="p-6 flex flex-col h-full z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center shadow-inner ${badgeClass} text-white`}>
                        <Icon className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                </div>
                <div className="mt-auto">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
                    <div className={`text-3xl font-black ${iconColor} tracking-tight`}>
                        {value}
                    </div>
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

const TenantCard = ({ tenant, onAssignRoom, onDelete }: { tenant: Tenant, onAssignRoom: (tenant: Tenant) => void, onDelete: (tenant: Tenant) => void }) => {
    const room = tenant.roomId as IRoom | undefined;
    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
            <Card className="relative overflow-hidden border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-500 rounded-[2.5rem] bg-white/70 backdrop-blur-xl group">
                {/* Visual Ambient Glow based on active status */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${tenant.status === 'ACTIVE' ? 'from-emerald-100/50' : 'from-slate-200/50'} to-transparent opacity-60 rounded-full blur-2xl pointer-events-none -z-10`}></div>
                
                <CardHeader className="flex flex-row items-center gap-4 p-5 pb-3">
                    <Avatar className="h-14 w-14 border-4 border-white shadow-md bg-slate-100 flex-shrink-0">
                        <AvatarFallback className="text-lg font-black text-[#0B2863] bg-gradient-to-br from-blue-50 to-indigo-100">
                            {tenant.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <Link href={`/dashboard/tenants/${tenant._id.toString()}`} className="group/link block truncate">
                            <CardTitle className="text-xl font-black tracking-tight text-slate-800 group-hover/link:text-blue-600 transition-colors truncate">
                                {tenant.fullName}
                            </CardTitle>
                        </Link>
                        <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5"><Phone size={12}/>{tenant.phoneNumber}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0 flex-shrink-0 rounded-full hover:bg-slate-100">
                                <MoreHorizontal className="h-5 w-5 text-slate-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100 p-2 min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Manage Tenant</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onAssignRoom(tenant)} className="cursor-pointer py-2.5 font-medium text-blue-700 focus:bg-blue-50 focus:text-blue-800 rounded-lg">
                                <Home className="mr-2 h-4 w-4" />Assign Chamber
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer py-2.5 text-red-600 font-bold focus:bg-red-50 focus:text-red-700 rounded-lg" onClick={() => onDelete(tenant)}>
                                <Trash2 className="mr-2 h-4 w-4" />Remove Record
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="p-5 pt-3">
                    <div className="flex justify-between items-center bg-slate-50/80 p-3 px-4 rounded-2xl border border-slate-100/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignment</p>
                        {room?.roomNumber ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-[1.5px] border-emerald-200/50 hover:bg-emerald-200 shadow-sm font-bold tracking-widest uppercase text-[10px] px-2 py-0.5">
                                <BedDouble className="mr-1 h-3 w-3 inline" /> {room.roomNumber}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-slate-100 text-slate-500 border-[1.5px] border-slate-200 uppercase tracking-widest font-bold text-[10px] px-2 py-0.5 shadow-sm">
                                Pending
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const TenantsPageSkeleton = () => (
    <div className="space-y-6 pt-4">
        <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-[160px] rounded-[2.5rem]" />
            <Skeleton className="h-[160px] rounded-[2.5rem]" />
            <Skeleton className="h-[160px] rounded-[2.5rem]" />
        </div>
        <Skeleton className="h-[72px] rounded-2xl w-full" />
        <Skeleton className="h-[400px] rounded-[2.5rem] w-full" />
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
            loading: `Erasing ${deleteTenant.fullName}...`,
            success: `Tenant record deleted.`,
            error: `Failed to erase record.`,
        });

        setDeleteTenant(null);
    };
    
    const handleExportCSV = () => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 800)), {
            loading: 'Generating File...',
            success: 'Export Complete',
            error: 'Failed to export'
        });
        
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-hidden selection:bg-[#0B2863]/20">
            {/* Ambient Background Shimmers */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none z-0"></div>
            <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-50/50 blur-[120px] pointer-events-none z-0"></div>

            <div className="container mx-auto py-8 md:py-10 px-4 md:px-8 relative z-10">
                {/* --- Header --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Tenant Directory</h1>
                        <p className="text-sm md:text-base font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {stats.total} Total Registered
                        </p>
                    </div>
                    <Button onClick={() => setAddDialogOpen(true)} className="hidden md:inline-flex h-12 bg-white text-[#0B2863] border border-slate-200/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-slate-50 transition-all font-bold rounded-full px-6 active:scale-95">
                        <PlusCircle className="mr-2 h-5 w-5 text-blue-500" /> New Tenant
                    </Button>
                </div>

                {isLoading && <TenantsPageSkeleton />}
                
                {error && (
                    <Alert variant="destructive" className="bg-red-50 border border-red-200 mt-6"><AlertCircle className="h-4 w-4" /><AlertTitle>System Alert</AlertTitle><AlertDescription>Failed to fetch tenant records. Please reload.</AlertDescription></Alert>
                )}

                {!isLoading && !error && (
                    <>
                        {/* --- Dashboard Stats --- */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                            <StatCardApp 
                                title="Total Roster" value={stats.total} Icon={Users} delay={0.1}
                                fromColor="from-blue-400" badgeClass="bg-blue-500 shadow-[0_5px_15px_rgba(59,130,246,0.3)]" iconColor="text-[#0B2863]"
                            />
                            <StatCardApp 
                                title="Active Residents" value={stats.active} Icon={UserCheck} delay={0.2}
                                fromColor="from-indigo-400" badgeClass="bg-indigo-500 shadow-[0_5px_15px_rgba(99,102,241,0.3)]" iconColor="text-indigo-900"
                            />
                            <StatCardApp 
                                title="Coverage" value={`${stats.occupied} / ${stats.total}`} Icon={BedDouble} delay={0.3}
                                fromColor="from-emerald-400" badgeClass="bg-emerald-500 shadow-[0_5px_15px_rgba(16,185,129,0.3)]" iconColor="text-emerald-900"
                            />
                        </div>
                        
                        {/* --- Filters & Actions --- */}
                        {tenants.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-3 mb-8 p-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input placeholder="Search resident database..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-12 bg-white border-transparent shadow-sm rounded-xl font-bold text-slate-800 placeholder:text-slate-400 focus-visible:ring-blue-100 focus-visible:border-blue-300 transition-all" />
                                </div>
                                <div className="flex gap-3">
                                   <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                                        <SelectTrigger className="w-full md:w-[190px] h-12 bg-white rounded-xl shadow-sm border-transparent font-bold text-slate-600 focus:ring-blue-100">
                                            <SelectValue placeholder="Filter by room" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-slate-100 font-medium">
                                            <SelectItem value="all">All Assignments</SelectItem>
                                            <SelectItem value="assigned">Assigned Only</SelectItem>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                        </SelectContent>
                                   </Select>
                                   <Button variant="outline" onClick={handleExportCSV} className="w-full md:w-auto h-12 rounded-xl border-transparent shadow-sm bg-white hover:bg-blue-50 hover:text-blue-700 font-bold text-slate-600 transition-colors">
                                       <Download className="mr-2 h-4 w-4" />Export
                                   </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* --- Main Content --- */}
                        {filteredTenants.length === 0 && tenants.length > 0 ? (
                            <div className="text-center py-20 px-4 mt-8 bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-sm">
                                <Users className="mx-auto h-10 w-10 text-slate-300 mb-4" />
                                <h3 className="text-xl font-black text-slate-700">No Query Matches</h3>
                                <p className="text-sm font-semibold text-slate-500 mt-1">Adjust search parameters.</p>
                            </div>
                        ) : tenants.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 px-4 mt-8 bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-sm">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-blue-500">
                                    <UserPlus className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Database Empty</h3>
                                <p className="mt-2 text-sm font-semibold text-slate-500 max-w-sm mx-auto">No residents currently logged. Begin by securely registering a new tenant.</p>
                                <div className="mt-8">
                                    <Button onClick={() => setAddDialogOpen(true)} className="h-12 rounded-full px-8 bg-[#0B2863] hover:bg-blue-800 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95"><PlusCircle className="mr-2 h-5 w-5" /> Initialize Record</Button>
                                </div>
                            </motion.div>
                        ) : isMobile ? (
                            <div className="space-y-4 pb-12">
                                <AnimatePresence>
                                    {filteredTenants.map(tenant => <TenantCard key={tenant._id.toString()} tenant={tenant} onAssignRoom={setAssignRoomTenant} onDelete={setDeleteTenant} />)}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-1 bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-sm overflow-hidden">
                                <DataTable 
                                    columns={columns} 
                                    data={filteredTenants} 
                                    filterColumnId="fullName"
                                    filterPlaceholder=""
                                />
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            {/* --- Mobile FAB & Modals --- */}
            <Button 
                onClick={() => setAddDialogOpen(true)} 
                className="fixed bottom-[calc(env(safe-area-inset-bottom,40px)+4.5rem)] right-6 h-16 w-16 bg-[#0B2863] hover:bg-blue-800 text-white rounded-full shadow-[0_10px_30px_rgba(11,40,99,0.3)] hover:shadow-[0_15px_40px_rgba(11,40,99,0.4)] transition-all transform hover:-translate-y-1 active:scale-90 z-[60] flex items-center justify-center md:hidden"
            >
                <PlusCircle className="h-8 w-8" />
                <span className="sr-only">Add Resident</span>
            </Button>
            
            {/* Adding the unified App-tier Modal Class overrides */}
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="p-8 pb-0">
                        <DialogHeader>
                            <div className="w-12 h-12 bg-blue-50 rounded-[1.2rem] flex items-center justify-center mb-4">
                                <UserPlus className="h-6 w-6 text-blue-600" />
                            </div>
                            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">New Tenant Record</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">Input residential details into the system.</DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8 pt-6 bg-slate-50 border-t border-slate-100 mt-6 max-h-[70vh] overflow-y-auto">
                        <AddTenantForm onSuccess={handleSuccess} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!assignRoomTenant} onOpenChange={(open) => !open && setAssignRoomTenant(null)}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="p-8 pb-0">
                        <DialogHeader>
                            <div className="w-12 h-12 bg-emerald-50 rounded-[1.2rem] flex items-center justify-center mb-4">
                                <Building className="h-6 w-6 text-emerald-600" />
                            </div>
                            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight text-left">Assign Chamber</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium text-left">Target: <span className="font-bold text-slate-800">{assignRoomTenant?.fullName}</span>. Link to vacant unit.</DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8 pt-6 bg-slate-50 border-t border-slate-100 mt-6">
                        {assignRoomTenant && <AssignRoomForm tenant={assignRoomTenant} onSuccess={handleSuccess} />}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteTenant} onOpenChange={(open) => !open && setDeleteTenant(null)}>
                <AlertDialogContent className="rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl max-w-sm">
                    <div className="p-8 pb-6">
                        <AlertDialogHeader>
                            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="h-6 w-6 text-rose-600" />
                            </div>
                            <AlertDialogTitle className="text-2xl font-black text-slate-800 tracking-tight text-center">Erase Record?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium text-center mt-2">
                                Permanently wipe the system record for <span className="font-bold text-slate-800">{deleteTenant?.fullName}</span>. This irreversible action cascades to associated data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="bg-slate-50 p-6 flex items-center justify-center gap-3 sm:justify-center border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 rounded-xl h-12 font-bold shadow-none border-slate-200 m-0">Abort</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="w-full sm:w-1/2 rounded-xl h-12 font-bold bg-rose-600 hover:bg-rose-700 m-0 shadow-sm text-white">Erase</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}