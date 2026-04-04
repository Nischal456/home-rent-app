'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'usehooks-ts';
import { toast } from 'react-hot-toast';
import NepaliDate from 'nepali-date-converter';

// --- UI Components & Icons ---
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, MoreHorizontal, FilePlus2, AlertCircle, Trash2, CheckCircle2, Share2, Printer, Search, Receipt, Calendar, Hash, FileText, CircleUserRound } from 'lucide-react';

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2 px-1 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors rounded-md">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon} <span className="font-medium">{label}</span></div>
        <div className="text-sm font-semibold text-right max-w-[60%] text-foreground truncate">{value}</div>
    </div>
);

const formatNepaliDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    return new NepaliDate(new Date(date)).format('YYYY MMMM DD');
};

// --- Page-Specific Components & Logic ---
import { getRentBillColumns, RentBillData } from './columns';
import { DataTable } from '../tenants/data-table';
import { AddRentBillForm } from './add-rent-bill-form';
import { IUser, IRoom } from '@/types';
import { printBill } from '@/lib/printBill';
import { RecordPaymentDialog } from '@/components/record-payment-dialog';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// --- Mobile-First Bill Card Component ---
const RentBillCard = ({ bill, onAction, onShare, onPrint, onClick }: { bill: RentBillData; onAction: (action: 'pay' | 'delete', bill: RentBillData) => void; onShare: (bill: RentBillData) => void; onPrint: (bill: RentBillData) => void; onClick: () => void }) => {
    const tenant = bill.tenantId as IUser;
    const room = bill.roomId as IRoom;

    return (
        <motion.div 
            layout 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className="cursor-pointer"
        >
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-[3px] border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                    <div className="flex-1 min-w-0 pr-2">
                        <CardTitle className="text-sm font-semibold text-gray-800 truncate">{tenant?.fullName ?? 'Unknown'}</CardTitle>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">Room: {room?.roomNumber ?? 'N/A'}</p>
                    </div>
                    <Badge variant={bill.status === 'PAID' ? 'default' : bill.status === 'PARTIALLY_PAID' ? 'outline' : 'destructive'} className={`text-[9px] h-4 px-1 ${bill.status === 'PAID' ? 'bg-green-500 hover:bg-green-600' : bill.status === 'PARTIALLY_PAID' ? 'border-primary text-primary' : ''}`}>
                        {bill.status}
                    </Badge>
                </CardHeader>
                <CardContent className="p-3 pt-1 pb-2">
                    <div className="flex justify-between items-end mb-1">
                        <div>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Rent</p>
                            <div className="text-lg font-bold text-primary leading-none">Rs {bill.amount.toLocaleString()}</div>
                        </div>
                        {parseFloat(bill.paidAmount as any) > 0 && bill.status !== 'PAID' && (
                            <div className="text-right">
                                 <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Paid</p>
                                 <div className="text-xs font-semibold text-green-600 leading-none">Rs {(bill.paidAmount || 0).toLocaleString()}</div>
                            </div>
                        )}
                    </div>
                    {/* Progress Bar added for partial payments */}
                    {parseFloat(bill.paidAmount as any) > 0 && bill.status !== 'PAID' && (
                        <>
                        <div className="w-full bg-blue-100 rounded-full h-1 mb-2 overflow-hidden text-right">
                            <div 
                                className="bg-blue-600 h-1 rounded-full transition-all duration-500 ease-in-out" 
                                style={{ width: `${Math.min(((bill.paidAmount || 0) / bill.amount) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <p>Remaining: <span className="font-semibold text-red-500">Rs {((bill.remainingAmount ?? bill.amount) || 0).toLocaleString()}</span></p>
                            <p>Period: <span className="font-medium text-gray-700">{bill.rentForPeriod}</span></p>
                        </div>
                        </>
                    )}
                    {(!parseFloat(bill.paidAmount as any) || bill.status === 'PAID') && (
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-0.5">
                            <p>Period: <span className="font-medium text-gray-700">{bill.rentForPeriod}</span></p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-gray-50/50 p-2 px-3 border-t">
                    <p className="text-[9px] text-muted-foreground">Date: {bill.billDateBS}</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                                <MoreHorizontal className="h-3 w-3" />
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
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Record Payment
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
  const [selectedBill, setSelectedBill] = useState<RentBillData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Professional Link Sharing Logic
  const handleShare = async (bill: RentBillData) => {
    const tenant = bill.tenantId as IUser;
    const billUrl = `${window.location.origin}/bill/${bill._id}`; // Uses the public bill page
    
    const remainingA = bill.remainingAmount ?? bill.amount;
    const shareText = `Rent Bill for ${tenant.fullName} (${bill.rentForPeriod}). Total: Rs ${bill.amount.toLocaleString('en-IN')}. Remaining: Rs ${remainingA.toLocaleString('en-IN')}. View details here:`;

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
    
    if (action === 'delete') {
        const url = `/api/rent-bills/${bill._id}`;
        const promise = fetch(url, { method: 'DELETE' }).then(async res => {
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to delete bill.`);
            }
            return res.json();
        });

        toast.promise(promise, {
            loading: `Deleting bill...`,
            success: () => {
                mutate(apiUrl); // Refresh data
                return `Bill deleted successfully!`;
            },
            error: (err) => err.message,
        });
    }
    setConfirmation(null);
  };
  
  const handleSuccess = useCallback(() => {
    setAddDialogOpen(false);
    setConfirmation(null);
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
        <div className="space-y-4 pb-32"> {/* Added padding-bottom for FAB and scrolling */}
            <AnimatePresence mode="popLayout">
                {filteredBills.length > 0 ? (
                    filteredBills.map((bill) => (
                        <RentBillCard 
                            key={bill._id.toString()} 
                            bill={bill} 
                            onClick={() => setSelectedBill(bill)}
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
      <Button 
        onClick={() => setAddDialogOpen(true)} 
        className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom,40px))] right-6 h-14 w-14 rounded-full shadow-xl z-[60] flex md:hidden items-center justify-center bg-primary hover:bg-primary/90 transition-transform active:scale-95"
      >
        <PlusCircle className="h-6 w-6" />
        <span className="sr-only">Add Rent Bill</span>
      </Button>

      {/* Mobile Pop-Up Drawer equivalent to Tenant views */}
      <Drawer open={!!selectedBill} onOpenChange={(isOpen) => !isOpen && setSelectedBill(null)}>
        <DrawerContent className="p-0 outline-none pb-safe">
          {selectedBill && (
             <div className="w-full sm:max-w-md mx-auto p-5 overflow-y-auto max-h-[85vh]">
                <DrawerHeader className="mb-4 px-0 pb-0">
                    <DrawerTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
                        <Receipt className="text-primary" /> Rent Bill
                    </DrawerTitle>
                    <DrawerDescription className="text-center mt-1 text-base">Bill for: {selectedBill.rentForPeriod}</DrawerDescription>
                </DrawerHeader>
                
                <div className="space-y-2 mt-4 px-1">
                    <DetailRow icon={<CircleUserRound size={16} />} label="Tenant" value={(selectedBill.tenantId as IUser)?.fullName ?? 'N/A'} />
                    <DetailRow icon={<Calendar size={16} />} label="Bill Date" value={selectedBill.billDateBS} />
                    <DetailRow icon={<Hash size={16} />} label="Status" value={<Badge variant={selectedBill.status === 'PAID' ? 'default' : selectedBill.status === 'PARTIALLY_PAID' ? 'outline' : 'destructive'} className={selectedBill.status === 'PARTIALLY_PAID' ? 'border-primary text-primary' : ''}>{selectedBill.status}</Badge>} />
                    
                    <div className="flex justify-between items-center pt-5 mt-5 border-t-2 border-primary/20">
                        <div className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Total Amount</div>
                        <div className="font-extrabold text-2xl text-primary">Rs {selectedBill.amount.toLocaleString()}</div>
                    </div>
                    
                    {(parseFloat(selectedBill.paidAmount as any) > 0) && (
                        <div className="bg-muted/50 p-4 rounded-xl mt-4 border">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">Paid</span>
                                <span className="font-bold text-green-600 text-lg">Rs {(selectedBill.paidAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-3">
                                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(((selectedBill.paidAmount || 0) / selectedBill.amount) * 100, 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-muted-foreground">Remaining</span>
                                <span className="font-bold text-red-500 text-lg uppercase">Rs {(selectedBill.remainingAmount ?? selectedBill.amount).toLocaleString()}</span>
                            </div>
                            
                            {selectedBill.paymentHistory && selectedBill.paymentHistory.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-dashed">
                                    <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payment Tracker</h5>
                                    <div className="space-y-2">
                                        {selectedBill.paymentHistory.map((pmt: any, idx: number) => (
                                            <div key={idx} className="flex flex-row justify-between items-start text-xs bg-white/60 p-2.5 rounded-lg border shadow-sm">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <div className="font-semibold text-gray-800">{formatNepaliDate(pmt.date)}</div>
                                                    {pmt.remarks && <div className="text-[10px] text-muted-foreground italic mt-0.5 truncate">{pmt.remarks}</div>}
                                                </div>
                                                <div className="font-bold text-green-600 shrink-0">Rs {pmt.amount.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <DrawerFooter className="px-0 pt-6">
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2 font-semibold shadow-sm" onClick={() => { setSelectedBill(null); printBill(selectedBill); }}>
                            <Printer className="w-4 h-4" /> Print
                        </Button>
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2 font-semibold shadow-sm" onClick={() => { setSelectedBill(null); handleShare(selectedBill); }}>
                            <Share2 className="w-4 h-4" /> Share
                        </Button>
                        {selectedBill.status !== 'PAID' && (
                            <Button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm" onClick={() => { setSelectedBill(null); setConfirmation({ action: 'pay', bill: selectedBill }); }}>
                                <CheckCircle2 className="w-4 h-4" /> Pay
                            </Button>
                        )}
                        <Button variant="destructive" className={`w-full flex items-center justify-center gap-2 font-bold shadow-sm ${selectedBill.status === 'PAID' ? "col-span-2" : ""}`} onClick={() => { setSelectedBill(null); setConfirmation({ action: 'delete', bill: selectedBill }); }}>
                            <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                    </div>
                </DrawerFooter>
             </div>
          )}
        </DrawerContent>
      </Drawer>

      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                  <DialogTitle>Create Rent Bill</DialogTitle>
                  <DialogDescription>Select a tenant to generate a new rent invoice.</DialogDescription>
              </DialogHeader>
              <AddRentBillForm onSuccess={handleSuccess} />
          </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmation && confirmation.action === 'delete'} onOpenChange={() => setConfirmation(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action will permanently delete this bill record.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleAction}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Confirm
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      {confirmation?.action === 'pay' && (
          <RecordPaymentDialog 
              isOpen={true} 
              onClose={() => setConfirmation(null)} 
              onSuccess={handleSuccess} 
              billId={confirmation.bill._id.toString()} 
              targetUrl={`/api/rent-bills/${confirmation.bill._id}/pay`} 
              totalAmount={confirmation.bill.amount} 
              remainingAmount={confirmation.bill.remainingAmount ?? confirmation.bill.amount} 
          />
      )}
    </>
  );
}