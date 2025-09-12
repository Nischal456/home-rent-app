'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useMediaQuery } from 'usehooks-ts';
import { toast } from 'react-hot-toast';

// --- UI Components & Icons ---
import { getMaintenanceColumns, MaintenanceData } from './columns';
import { DataTable } from '../tenants/data-table';
import { Loader2, Wrench, AlertCircle, Clock, CheckCircle, User, Home, Calendar, MoreHorizontal, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { IUser, IRoom } from '@/types';

// Type Definitions
type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

// SWR Fetcher
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch maintenance requests.');
    return res.json();
});

// Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};

// --- Helper Functions & Components (Defined once, outside the main component) ---

const getStatusBadge = (status: Status) => {
    switch (status) {
        case 'PENDING': return <Badge variant="destructive">Pending</Badge>;
        case 'IN_PROGRESS': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">In Progress</Badge>;
        case 'COMPLETED': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
    }
};

const StatCard = ({ title, value, icon, colorClass }: { title: string, value: number, icon: React.ReactNode, colorClass: string }) => (
    <motion.div variants={itemVariants}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={colorClass}>{icon}</div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
        </Card>
    </motion.div>
);

const MaintenanceCard = ({ request, onStatusChange, onViewDetails }: { request: MaintenanceData, onStatusChange: (request: MaintenanceData, status: Status) => void, onViewDetails: (request: MaintenanceData) => void }) => (
    <motion.div variants={itemVariants} layout>
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <button onClick={() => onViewDetails(request)} className="text-left">
                        <CardTitle className="text-lg mb-1 hover:underline">{request.issue}</CardTitle>
                    </button>
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center gap-2"><User size={12}/> {(request.tenantId as IUser).fullName}</p>
                        <p className="flex items-center gap-2"><Home size={12}/> Room {(request.roomId as IRoom).roomNumber}</p>
                        <p className="flex items-center gap-2"><Calendar size={12}/> {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                {getStatusBadge(request.status)}
            </CardHeader>
            <CardContent className="flex items-center justify-between bg-muted/30 pt-3">
                {/* ✅ FIX: Removed "truncate" and added flex properties to allow text wrapping */}
                <p className="flex-1 min-w-0 pr-4 text-sm text-muted-foreground">{request.description}</p>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onStatusChange(request, 'PENDING')} disabled={request.status === 'PENDING'}>Set as Pending</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(request, 'IN_PROGRESS')} disabled={request.status === 'IN_PROGRESS'}>Set as In Progress</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(request, 'COMPLETED')} disabled={request.status === 'COMPLETED'}>Set as Completed</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardContent>
        </Card>
    </motion.div>
);

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-start py-2.5 border-b gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-shrink-0">{icon}<span>{label}</span></div>
        <div className="font-semibold text-sm text-right">{value}</div>
    </div>
);

const PageSkeleton = () => (
    <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3"><Skeleton className="h-24"/><Skeleton className="h-24"/><Skeleton className="h-24"/></div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4"><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/></div>
    </div>
);


// --- Main Page Component ---
export default function MaintenancePage() {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const { mutate } = useSWRConfig();
    const apiUrl = '/api/maintenance';

    const { data: apiResponse, error, isLoading } = useSWR(apiUrl, fetcher);
    const requests: MaintenanceData[] = apiResponse?.data ?? [];

    const [confirmation, setConfirmation] = useState<{ request: MaintenanceData; status: Status } | null>(null);
    const [activeTab, setActiveTab] = useState<Status | 'ALL'>('ALL');
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceData | null>(null);

    const handleStatusChange = async () => {
        if (!confirmation) return;
        const { request, status } = confirmation;

        const promise = fetch(`/api/maintenance/${request._id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
        }).then(res => {
            if (!res.ok) throw new Error(`Failed to update status.`);
            return res.json();
        }).then(() => {
            mutate(apiUrl);
        });

        toast.promise(promise, { loading: 'Updating status...', success: 'Status updated!', error: 'Failed to update.' });
        setConfirmation(null);
    };

    const { filteredRequests, stats } = useMemo(() => {
        const stats = {
            PENDING: requests.filter(r => r.status === 'PENDING').length,
            IN_PROGRESS: requests.filter(r => r.status === 'IN_PROGRESS').length,
            COMPLETED: requests.filter(r => r.status === 'COMPLETED').length,
        };
        const filtered = activeTab === 'ALL' ? requests : requests.filter(r => r.status === activeTab);
        return { filteredRequests: filtered, stats };
    }, [requests, activeTab]);

    const columns = useMemo(() => getMaintenanceColumns(
        (request, status) => setConfirmation({ request, status }),
        (request) => setSelectedRequest(request)
    ), []);

    const renderContent = () => {
        if (filteredRequests.length === 0 && requests.length > 0) {
            return <div className="text-center py-20 border-2 border-dashed rounded-lg"><h3 className="text-lg font-semibold">No requests found for this status.</h3></div>;
        }
        if (requests.length === 0) {
            return <div className="text-center py-20 border-2 border-dashed rounded-lg"><Wrench className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No Maintenance Requests</h3><p className="mt-1 text-sm text-muted-foreground">All clear for now!</p></div>;
        }
        return isMobile ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                <AnimatePresence>
                    {filteredRequests.map(req => (
                        <MaintenanceCard
                            key={req._id.toString()}
                            request={req}
                            onStatusChange={(request, status) => setConfirmation({ request, status })}
                            onViewDetails={setSelectedRequest}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        ) : (
            <DataTable columns={columns} data={filteredRequests} filterColumnId="tenantName" filterPlaceholder="Filter by tenant..." />
        );
    };

    if (isLoading) return <div className="container mx-auto py-10"><PageSkeleton /></div>;
    if (error) return <div className="container mx-auto py-10"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert></div>;

    return (
        <>
            <div className="container mx-auto py-10">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Maintenance Requests</h1>
                    <p className="text-muted-foreground">View and manage all tenant maintenance requests.</p>
                </div>
                
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                    <StatCard title="Pending" value={stats.PENDING} icon={<Clock size={16}/>} colorClass="text-destructive" />
                    <StatCard title="In Progress" value={stats.IN_PROGRESS} icon={<Loader2 size={16} className="animate-spin"/>} colorClass="text-blue-500" />
                    <StatCard title="Completed" value={stats.COMPLETED} icon={<CheckCircle size={16}/>} colorClass="text-green-500" />
                </motion.div>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Status | 'ALL')} className="w-full">
                    <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="ALL">All</TabsTrigger><TabsTrigger value="PENDING">Pending</TabsTrigger><TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger><TabsTrigger value="COMPLETED">Completed</TabsTrigger></TabsList>
                    <TabsContent value={activeTab} className="mt-6">{renderContent()}</TabsContent>
                </Tabs>
            </div>

            <Sheet open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
                <SheetContent className="w-full sm:max-w-lg p-6 overflow-y-auto">
                    {selectedRequest && (
                        <>
                            <SheetHeader className="mb-6 text-left">
                                <SheetTitle className="text-2xl">{selectedRequest.issue}</SheetTitle>
                                <SheetDescription>Full details for the maintenance request.</SheetDescription>
                            </SheetHeader>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2 text-primary">Request Details</h4>
                                    <DetailRow icon={<User size={16} />} label="Tenant" value={(selectedRequest.tenantId as IUser).fullName} />
                                    <DetailRow icon={<Home size={16} />} label="Room" value={(selectedRequest.roomId as IRoom).roomNumber} />
                                    <DetailRow icon={<Calendar size={16} />} label="Date Reported" value={new Date(selectedRequest.createdAt).toLocaleString()} />
                                    <DetailRow icon={<CheckCircle size={16} />} label="Status" value={getStatusBadge(selectedRequest.status)} />
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 text-primary">Full Description</h4>
                                    <div className="text-sm text-foreground bg-muted/50 p-3 rounded-md border min-h-[80px]">
                                        {selectedRequest.description}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 text-primary">Contact Information</h4>
                                    <DetailRow icon={<Phone size={16} />} label="Phone Number" value={(selectedRequest.tenantId as IUser).phoneNumber} />
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!confirmation} onOpenChange={() => setConfirmation(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
                        <AlertDialogDescription>Update status for "{confirmation?.request.issue}" to "{confirmation?.status.replace('_', ' ')}"?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStatusChange}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}