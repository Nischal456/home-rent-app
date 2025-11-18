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
import { Loader2, PlusCircle, MoreHorizontal, FilePlus2, AlertCircle, Trash2, CheckCircle2, Share2, Printer, Search } from 'lucide-react';

// --- Page-Specific Components & Logic ---
import { getRentBillColumns, RentBillData } from './columns';
import { DataTable } from '../tenants/data-table';
import { AddRentBillForm } from './add-rent-bill-form';
import { IUser, IRoom } from '@/types';
import { printBill } from '@/lib/printBill';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// --- Mobile-First Bill Card Component ---
const RentBillCard = ({ bill, onAction, onShare, onPrint }: { bill: RentBillData; onAction: (action: 'pay' | 'delete', bill: RentBillData) => void; onShare: (bill: RentBillData) => void; onPrint: (bill: RentBillData) => void; }) => {
    const tenant = bill.tenantId as IUser;
    const room = bill.roomId as IRoom;

    return (
        <motion.div 
            layout 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-lg font-semibold text-gray-800">{tenant?.fullName ?? 'Unknown Tenant'}</CardTitle>
                        <p className="text-sm text-muted-foreground font-medium">Room: {room?.roomNumber ?? 'N/A'}</p>
                    </div>
                    <Badge variant={bill.status === 'PAID' ? 'default' : 'destructive'} className={bill.status === 'PAID' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {bill.status}
                    </Badge>
                </CardHeader>
                <CardContent className="pb-2">
                    <div className="text-2xl font-bold text-primary">Rs {bill.amount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Period: <span className="font-medium text-gray-700">{bill.rentForPeriod}</span></p>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-gray-50/50 p-3 border-t">
                    <p className="text-xs text-muted-foreground">Date: {bill.billDateBS}</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onPrint(bill)}>
                                <Printer className="mr-2 h-4 w-4" /> Print Bill
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onShare(bill)}>
                                <Share2 className="mr-2 h-4 w-4" /> Share Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {bill.status !== 'PAID' && (
                                <DropdownMenuItem onClick={() => onAction('pay', bill)}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Mark as Paid
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => onAction('delete', bill)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Bill
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

// --- Main Page Component ---
export default function RentBillsPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { mutate } = useSWRConfig();
  const apiUrl = '/api/rent-bills';

  const { data: apiResponse, error, isLoading } = useSWR(apiUrl, fetcher, { 
      revalidateOnFocus: false,
      dedupingInterval: 5000 
  });
  
  const bills: RentBillData[] = apiResponse?.data ?? [];

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ action: 'pay' | 'delete'; bill: RentBillData; } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Professional Link Sharing Logic
  const handleShare = async (bill: RentBillData) => {
    const tenant = bill.tenantId as IUser;
    const billUrl = `${window.location.origin}/bill/${bill._id}`; // Uses the public bill page
    const shareText = `Rent Bill for ${tenant.fullName} (${bill.rentForPeriod}). View details here:`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: `Rent Bill: ${tenant.fullName}`,
                text: shareText,
                url: billUrl,
            });
        } catch (err) {
            console.error("Share failed/cancelled:", err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(`${shareText} ${billUrl}`);
            toast.success('Bill link copied to clipboard!');
        } catch (err) {
            toast.error('Could not copy link.');
        }
    }
  };

  const handleAction = async () => {
    if (!confirmation) return;
    const { action, bill } = confirmation;
    const url = `/api/rent-bills/${bill._id}`;
    const method = action === 'pay' ? 'PATCH' : 'DELETE';
    
    const promise = fetch(url, { method }).then(async res => {
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Failed to ${action} bill.`);
        }
        return res.json();
    });

    toast.promise(promise, {
        loading: `${action === 'pay' ? 'Updating' : 'Deleting'} bill...`,
        success: () => {
            mutate(apiUrl); // Refresh data
            return `Bill ${action === 'pay' ? 'marked as paid' : 'deleted'} successfully!`;
        },
        error: (err) => err.message,
    });
    setConfirmation(null);
  };
  
  const handleSuccess = useCallback(() => {
    setAddDialogOpen(false);
    mutate(apiUrl);
  }, [mutate, apiUrl]);

  // Filter bills based on search query
  const filteredBills = useMemo(() => {
    if (!searchQuery) return bills;
    return bills.filter(bill => {
        const tenant = bill.tenantId as IUser;
        return tenant?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [bills, searchQuery]);

  const columns = useMemo(() => getRentBillColumns(
    (action, bill) => setConfirmation({ action, bill }),
    printBill,
    handleShare
  ), []);

  const renderContent = () => {
    if (isLoading) { 
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>; 
    }
    
    if (error) { 
        return (
            <div className="py-10">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load bills. Please check your connection.</AlertDescription>
                </Alert>
            </div>
        ); 
    }

    if (bills.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-gray-50/50">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <FilePlus2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">No Rent Bills Found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">Start by creating a new rent bill for your tenants.</p>
                <div className="mt-6">
                    <Button onClick={() => setAddDialogOpen(true)} className="shadow-md">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create First Bill
                    </Button>
                </div>
            </div>
        );
    }

    return isMobile ? (
        <div className="space-y-4 pb-20"> {/* Added padding-bottom for FAB */}
            <AnimatePresence mode="popLayout">
                {filteredBills.length > 0 ? (
                    filteredBills.map((bill) => (
                        <RentBillCard 
                            key={bill._id.toString()} 
                            bill={bill} 
                            onAction={(action, b) => setConfirmation({ action, bill: b })} 
                            onShare={handleShare} 
                            onPrint={printBill} 
                        />
                    ))
                ) : (
                    <div className="text-center py-10 text-muted-foreground">No bills match your search.</div>
                )}
            </AnimatePresence>
        </div>
    ) : (
        <div className="rounded-md border shadow-sm bg-white">
            <DataTable columns={columns} data={filteredBills} filterColumnId="tenantName" filterPlaceholder="Filter by tenant..." />
        </div>
    );
  };

  return (
    <>
      <div className="container mx-auto py-8 px-4 md:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Rent Bills</h1>
            <p className="text-muted-foreground mt-1">Manage and track rent payments efficiently.</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="hidden md:inline-flex shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Rent Bill
          </Button>
        </div>
        
        {/* ✅ Mobile Search Bar */}
        {isMobile && (
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search tenant name..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="pl-9 bg-white shadow-sm" 
                />
            </div>
        )}

        {renderContent()}
      </div>

      {/* Floating Action Button (Mobile) */}
      {isMobile && (
          <Button 
            onClick={() => setAddDialogOpen(true)} 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 flex items-center justify-center bg-primary hover:bg-primary/90 transition-transform active:scale-95"
          >
            <PlusCircle className="h-6 w-6" />
            <span className="sr-only">Add Rent Bill</span>
          </Button>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                  <DialogTitle>Create Rent Bill</DialogTitle>
                  <DialogDescription>Select a tenant to generate a new rent invoice.</DialogDescription>
              </DialogHeader>
              <AddRentBillForm onSuccess={handleSuccess} />
          </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmation} onOpenChange={() => setConfirmation(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action will permanently {confirmation?.action === 'pay' ? 'mark this bill as PAID' : 'delete this bill record'}.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleAction}
                    className={confirmation?.action === 'delete' ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    Confirm
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}