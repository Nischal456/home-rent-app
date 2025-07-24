'use client';

import React from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IRentBill, IUtilityBill, IUser } from '@/types';
import { IndianRupee, Zap } from 'lucide-react';

// Define a union type for the bill
type StatementEntry = (IRentBill & { type: 'Rent' }) | (IUtilityBill & { type: 'Utility' });

// --- Helper Components for a Cleaner Look ---

// A flexible row for displaying details
const DetailRow = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
  <div className={cn("flex justify-between items-center py-2", className)}>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-semibold text-sm">{value}</p>
  </div>
);

// A dedicated component for the beautifully formatted utility details
const UtilityDetails = ({ bill }: { bill: IUtilityBill }) => (
  <div className="space-y-6">
    {/* Electricity Section */}
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">⚡️ ELECTRICITY</h4>
      <div className="border-l-2 pl-4 space-y-1">
        <DetailRow label="Previous Reading" value={bill.electricity.previousReading} />
        <DetailRow label="Current Reading" value={bill.electricity.currentReading} />
        <DetailRow label="Units Consumed" value={bill.electricity.unitsConsumed} />
        <DetailRow label="Amount" value={`Rs ${bill.electricity.amount.toLocaleString()}`} className="border-t mt-1" />
      </div>
    </div>
    
    {/* Water Section */}
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">💧 WATER</h4>
      <div className="border-l-2 pl-4 space-y-1">
        <DetailRow label="Previous Reading" value={bill.water.previousReading} />
        <DetailRow label="Current Reading" value={bill.water.currentReading} />
        <DetailRow label="Units Consumed" value={bill.water.unitsConsumed} />
        <DetailRow label="Amount" value={`Rs ${bill.water.amount.toLocaleString()}`} className="border-t mt-1" />
      </div>
    </div>

    {/* Other Charges Section */}
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">🛠️ OTHER CHARGES</h4>
       <div className="border-l-2 pl-4 space-y-1">
        <DetailRow label="Service Charge" value={`Rs ${bill.serviceCharge.toLocaleString()}`} />
        <DetailRow label="Security Charge" value={`Rs ${bill.securityCharge.toLocaleString()}`} />
      </div>
    </div>
  </div>
);

// --- Main Content Component (Shared between Dialog and Drawer) ---

const BillContent = ({ bill, tenant }: { bill: StatementEntry, tenant: IUser }) => {
  const isUtility = bill.type === 'Utility';
  const totalAmount = isUtility ? bill.totalAmount : bill.amount;

  return (
    <div className="p-4 sm:p-0">
      <div className="grid gap-6">
        {/* General Info Section */}
        <div className="grid gap-2 p-4 rounded-lg bg-muted/50">
           <DetailRow label="Tenant" value={tenant.fullName} />
           <DetailRow label="Bill Date" value={new Date(bill.billDateAD).toLocaleDateString()} />
           <DetailRow label="Status" value={<Badge variant={bill.status === 'PAID' ? 'default' : 'destructive'}>{bill.status}</Badge>} />
        </div>

        {/* Bill Specific Details */}
        {isUtility ? (
          <UtilityDetails bill={bill} />
        ) : (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">RENT DETAILS</h4>
            <div className="border-l-2 pl-4">
              <DetailRow label="For Period" value={bill.rentForPeriod} />
            </div>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex items-center justify-between border-t-2 pt-4 mt-2">
            <p className="text-lg font-bold">Grand Total</p>
            <p className="text-2xl font-extrabold text-primary">
              Rs {totalAmount.toLocaleString()}
            </p>
        </div>
      </div>
    </div>
  );
};


// --- The Main Exported Component ---

export function BillDetailsDialog({ bill, tenant, onClose }: { bill: StatementEntry | null, tenant: IUser | null, onClose: () => void }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!bill || !tenant) {
    return null;
  }
  
  const isUtility = bill.type === 'Utility';
  const title = `${bill.type} Bill Details`;
  const description = `Detailed breakdown for the bill issued on ${new Date(bill.billDateAD).toLocaleDateString()}.`;

  // Render Dialog for Desktop
  if (isDesktop) {
    return (
      <Dialog open={!!bill} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isUtility ? <Zap size={18} /> : <IndianRupee size={18} />}
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <BillContent bill={bill} tenant={tenant} />
        </DialogContent>
      </Dialog>
    );
  }

  // Render Drawer for Mobile
  return (
    <Drawer open={!!bill} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            {isUtility ? <Zap size={18} /> : <IndianRupee size={18} />}
            {title}
          </DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <BillContent bill={bill} tenant={tenant} />
        <DrawerFooter className="pt-4">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}