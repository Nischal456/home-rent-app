'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'usehooks-ts';
import { toast } from 'react-hot-toast';

// --- UI Components & Icons ---
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, MoreHorizontal, FilePlus2, AlertCircle, Trash2, CheckCircle2, Zap, Share2, Printer, Search } from 'lucide-react';

// --- Page-Specific Components & Logic ---
import { getUtilityBillColumns, UtilityBillData } from './columns';
import { DataTable } from '../tenants/data-table';
import { AddUtilityBillForm } from './add-utility-bill-form';
import { IUser, IRoom } from '@/types';
import { printBill } from '@/lib/printBill';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const UtilityBillCard = ({ bill, onAction, onShare, onPrint }: { bill: UtilityBillData; onAction: (action: 'pay' | 'delete', bill: UtilityBillData) => void; onShare: (bill: UtilityBillData) => void; onPrint: (bill: UtilityBillData) => void; }) => {
    const tenant = bill.tenantId as IUser;
    const room = bill.roomId as IRoom;

    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-lg">{tenant?.fullName ?? 'N/A'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{room?.roomNumber ?? 'N/A'}</p>
                    </div>
                    <Badge variant={bill.status === 'PAID' ? 'default' : 'destructive'}>{bill.status}</Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rs {bill.totalAmount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">For month: {bill.billingMonthBS}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Due: {bill.billDateBS}</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onPrint(bill)}><Printer className="mr-2 h-4 w-4" /> Print Bill</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onShare(bill)}><Share2 className="mr-2 h-4 w-4" /> Share Bill</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onAction('pay', bill)} disabled={bill.status === 'PAID'}><CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onAction('delete', bill)}><Trash2 className="mr-2 h-4 w-4" /> Delete Bill</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default function UtilityBillsPage() {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const { mutate } = useSWRConfig();
    const apiUrl = '/api/utility-bills';

    const { data: apiResponse, error, isLoading } = useSWR(apiUrl, fetcher);
    const bills: UtilityBillData[] = apiResponse?.data ?? [];

    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{ action: 'pay' | 'delete'; bill: UtilityBillData; } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // ✅ DEFINITIVE FIX: New, robust, and professional link-sharing logic
    const handleShare = async (bill: UtilityBillData) => {
        const tenant = bill.tenantId as IUser;
        // This URL points to a public page you will create to display a single bill.
        // For example: app/bill/[billId]/page.tsx
        const billUrl = `${window.location.origin}/bill/${bill._id}`;
        const shareText = `Utility bill for ${tenant.fullName} for the period of ${bill.billingMonthBS}.`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `STG Tower Utility Bill`,
                    text: shareText,
                    url: billUrl,
                });
            } catch (err) {
                // This catches if the user cancels the share, so no error toast is needed.
                if ((err as Error).name !== 'AbortError') {
                    console.error("Share failed:", err);
                    toast.error("Could not share the bill.");
                }
            }
        } else {
            // Fallback for desktop browsers: copy link to clipboard
            try {
                await navigator.clipboard.writeText(billUrl);
                toast.success('Bill link copied to clipboard!');
            } catch (err) {
                toast.error('Could not copy link.');
            }
        }
    };

    const handleAction = async () => {
        if (!confirmation) return;
        const { action, bill } = confirmation;
        const url = `/api/utility-bills/${bill._id}`;
        const method = action === 'pay' ? 'PATCH' : 'DELETE';
        const promise = fetch(url, { method }).then(res => {
            if (!res.ok) throw new Error(`Failed to ${action} bill.`);
            return res.json();
        }).then(() => { 
            mutate(apiUrl); // Revalidate SWR cache
        });
        toast.promise(promise, {
            loading: `${action === 'pay' ? 'Updating' : 'Deleting'} bill...`,
            success: `Bill ${action === 'pay' ? 'marked as paid' : 'deleted'} successfully!`,
            error: `Failed to ${action} the bill.`,
        });
        setConfirmation(null);
    };

    const handleSuccess = useCallback(() => {
        setAddDialogOpen(false);
        mutate(apiUrl);
    }, [mutate, apiUrl]);

    // ✅ FIX: Filtering logic is now correct and efficient
    const filteredBills = useMemo(() => {
        if (!searchQuery) return bills;
        return bills.filter(bill => {
            const tenant = bill.tenantId as IUser;
            return tenant.fullName.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [bills, searchQuery]);

    const columns = useMemo(() => getUtilityBillColumns(
        (action, bill) => setConfirmation({ action, bill }),
        printBill,
        handleShare // Pass the new share handler
    ), []);

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
        }
        if (error) {
            return (
                <div className="py-10">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Failed to Load Bills</AlertTitle>
                        <AlertDescription>{error.message || 'An unknown error occurred.'}</AlertDescription>
                    </Alert>
                </div>
            );
        }
        if (bills.length === 0) {
            return (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Utility Bills Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new utility bill.</p>
                    <div className="mt-6">
                        <Button onClick={() => setAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add First Bill</Button>
                    </div>
                </div>
            );
        }
        // Mobile view now uses the filteredBills array
        return isMobile ? (
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredBills.map((bill) => (
                        <UtilityBillCard key={bill._id.toString()} bill={bill} onAction={(action, b) => setConfirmation({ action, bill: b })} onShare={handleShare} onPrint={printBill} />
                    ))}
                </AnimatePresence>
            </div>
        ) : (
            // Desktop view also uses the filteredBills array
            <DataTable columns={columns} data={filteredBills} filterColumnId="tenantName" filterPlaceholder="Filter by tenant..." />
        );
    };

    return (
        <>
            <div className="container mx-auto py-10">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Utility Bills</h1>
                        <p className="text-muted-foreground">Create and manage monthly utility bills.</p>
                    </div>
                    <Button onClick={() => setAddDialogOpen(true)} className="hidden md:inline-flex shrink-0">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Utility Bill
                    </Button>
                </div>
                
                {/* ✅ ADDED: Mobile Search Bar */}
                {isMobile && (
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search by tenant name..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="pl-10" 
                        />
                    </div>
                )}
                
                {renderContent()}
            </div>
            
            {isMobile && (
                <Button onClick={() => setAddDialogOpen(true)} className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 flex items-center justify-center md:hidden">
                    <PlusCircle className="h-8 w-8" />
                    <span className="sr-only">Add Utility Bill</span>
                </Button>
            )}
            
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Utility Bill</DialogTitle>
                        <DialogDescription>Enter meter readings and charges for a tenant.</DialogDescription>
                    </DialogHeader>
                    <AddUtilityBillForm onSuccess={handleSuccess} />
                </DialogContent>
            </Dialog>
            
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