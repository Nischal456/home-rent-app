'use client';

import React from 'react';
import { useMediaQuery } from 'usehooks-ts';
import NepaliDate from 'nepali-date-converter'; // ✅ For Nepali Dates
import { toast } from 'react-hot-toast'; // ✅ For Share feedback

// --- UI Components ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';

// --- Utilities & Types ---
import { cn } from '@/lib/utils';
import { IRentBill, IUtilityBill, IUser } from '@/types';
import { IndianRupee, Zap, Droplets, Wrench, Shield, Share2, Link2 } from 'lucide-react'; // ✅ Added Share icons

// Define a union type for the bill
type StatementEntry = (IRentBill & { type: 'Rent' }) | (IUtilityBill & { type: 'Utility' });

// --- Helper Functions & Components ---

const formatNepaliDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    return new NepaliDate(new Date(date)).format('YYYY MMMM DD');
};

const DetailRow = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
  <div className={cn("flex justify-between items-center py-2", className)}>
    <p className="text-sm text-muted-foreground">{label}</p>
    <div className="font-semibold text-sm text-right">{value}</div>
  </div>
);

const UtilityDetails = ({ bill }: { bill: IUtilityBill }) => (
  <div className="space-y-6">
    <div>
      {/* ✅ Replaced emoji with icon */}
      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2"><Zap size={14} /> ELECTRICITY</h4>
      <div className="border-l-2 pl-4 space-y-1">
        <DetailRow label="Previous Reading" value={bill.electricity.previousReading} />
        <DetailRow label="Current Reading" value={bill.electricity.currentReading} />
        <DetailRow label="Units Consumed" value={bill.electricity.unitsConsumed} />
        <DetailRow label="Amount" value={`Rs ${bill.electricity.amount.toLocaleString()}`} className="border-t mt-1" />
      </div>
    </div>
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2"><Droplets size={14} /> WATER</h4>
      <div className="border-l-2 pl-4 space-y-1">
        <DetailRow label="Previous Reading" value={bill.water.previousReading} />
        <DetailRow label="Current Reading" value={bill.water.currentReading} />
        <DetailRow label="Units Consumed" value={bill.water.unitsConsumed} />
        <DetailRow label="Amount" value={`Rs ${bill.water.amount.toLocaleString()}`} className="border-t mt-1" />
      </div>
    </div>
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2"><Wrench size={14} /> OTHER CHARGES</h4>
       <div className="border-l-2 pl-4 space-y-1">
        <DetailRow label="Service Charge" value={`Rs ${bill.serviceCharge.toLocaleString()}`} />
        <DetailRow label="Security Charge" value={`Rs ${bill.securityCharge.toLocaleString()}`} />
      </div>
    </div>
  </div>
);

const BillContent = ({ bill, tenant }: { bill: StatementEntry, tenant: IUser }) => {
  const isUtility = bill.type === 'Utility';
  const totalAmount = isUtility ? bill.totalAmount : bill.amount;

  return (
    <div className="p-4 sm:p-0">
      <div className="grid gap-6">
        <div className="grid gap-2 p-4 rounded-lg bg-muted/50">
           <DetailRow label="Tenant" value={tenant.fullName} />
           {/* ✅ Formatted date in Nepali */}
           <DetailRow label="Bill Date (B.S.)" value={formatNepaliDate(bill.billDateAD)} />
           <DetailRow label="Status" value={<Badge variant={bill.status === 'PAID' ? 'default' : 'destructive'}>{bill.status}</Badge>} />
        </div>

        {isUtility ? (
          <UtilityDetails bill={bill} />
        ) : (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">RENT DETAILS</h4>
            <div className="border-l-2 pl-4"><DetailRow label="For Period" value={bill.rentForPeriod} /></div>
          </div>
        )}

        <div className="flex items-center justify-between border-t-2 pt-4 mt-2">
            <p className="text-lg font-bold">Grand Total</p>
            <p className="text-2xl font-extrabold text-primary">Rs {totalAmount.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// --- The Main Exported Component ---
export function BillDetailsDialog({ bill, tenant, onClose }: { bill: StatementEntry | null, tenant: IUser | null, onClose: () => void }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!bill || !tenant) return null;
  
  const isUtility = bill.type === 'Utility';
  const title = `${bill.type} Bill Details`;
  const description = `Detailed breakdown for the bill issued on ${formatNepaliDate(bill.billDateAD)}.`;
  const billUrl = typeof window !== 'undefined' ? `${window.location.origin}/bill/${bill._id}` : '';

  // ✅ Share functionality
  const handleShare = async () => {
    const shareText = `Bill for ${tenant.fullName}. View details here: ${billUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${bill.type} Bill`, text: shareText, url: billUrl });
      } catch (error) { console.error('Error sharing:', error); }
    } else {
      try {
        await navigator.clipboard.writeText(billUrl);
        toast.success('Bill link copied to clipboard!');
      } catch (err) { toast.error('Failed to copy link.'); }
    }
  };

  if (isDesktop) {
    return (
      <Dialog open={!!bill} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{isUtility ? <Zap size={18} /> : <IndianRupee size={18} />} {title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <BillContent bill={bill} tenant={tenant} />
          {/* ✅ Added Share Button to Footer */}
          <DialogFooter className="pt-4 border-t">
            <Button onClick={handleShare} className="w-full">
              <Share2 className="mr-2 h-4 w-4" /> Share Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={!!bill} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">{isUtility ? <Zap size={18} /> : <IndianRupee size={18} />} {title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4"><BillContent bill={bill} tenant={tenant} /></div>
        <DrawerFooter className="pt-4">
          {/* ✅ Added Share Button to Footer */}
          <Button onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" /> Share Bill
          </Button>
          <DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}