'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { IRentBill, IUtilityBill } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { Separator } from '@/components/ui/separator';
import { printBill } from '@/lib/printBill';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

type CombinedBill = (IRentBill | IUtilityBill) & { type: 'Rent' | 'Utility' };

interface BillDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bill: CombinedBill | null;
}

export function BillDetailsDialog({ isOpen, onClose, bill }: BillDetailsDialogProps) {
  if (!bill) return null;

  const isRentBill = bill.type === 'Rent';
  const tenant = (bill.tenantId as any);
  const room = (bill.roomId as any);
  const totalAmount = isRentBill ? (bill as IRentBill).amount : (bill as IUtilityBill).totalAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Bill Details</DialogTitle>
          <DialogDescription className="text-center">
            A detailed breakdown of your {bill.type.toLowerCase()} bill.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Tenant:</span>
                <span className="font-medium">{tenant?.fullName}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Room:</span>
                <span className="font-medium">{room?.roomNumber}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Bill Date (B.S):</span>
                <span className="font-medium">{new NepaliDate(bill.billDateAD).format('YYYY-MM-DD')}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium ${bill.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>{bill.status}</span>
            </div>

            <Separator className="my-4" />

            <h3 className="font-semibold mb-2">Charges</h3>
            {isRentBill ? (
                <div className="flex justify-between">
                    <span>{(bill as IRentBill).rentForPeriod}</span>
                    <span className="font-medium">Rs {(bill as IRentBill).amount.toLocaleString()}</span>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Electricity</h4>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Previous Reading:</span><span>{(bill as IUtilityBill).electricity.previousReading}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Current Reading:</span><span>{(bill as IUtilityBill).electricity.currentReading}</span></div>
                        <div className="flex justify-between text-xs font-semibold"><span className="text-muted-foreground">Units Consumed:</span><span>{(bill as IUtilityBill).electricity.unitsConsumed}</span></div>
                        <div className="flex justify-between mt-1 pt-1 border-t"><span className="text-muted-foreground">Amount:</span><span className="font-medium">Rs {(bill as IUtilityBill).electricity.amount.toLocaleString()}</span></div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Water</h4>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Previous Reading:</span><span>{(bill as IUtilityBill).water.previousReading}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Current Reading:</span><span>{(bill as IUtilityBill).water.currentReading}</span></div>
                        <div className="flex justify-between text-xs font-semibold"><span className="text-muted-foreground">Units Consumed:</span><span>{(bill as IUtilityBill).water.unitsConsumed}</span></div>
                        <div className="flex justify-between mt-1 pt-1 border-t"><span className="text-muted-foreground">Amount:</span><span className="font-medium">Rs {(bill as IUtilityBill).water.amount.toLocaleString()}</span></div>
                    </div>
                    {(bill as IUtilityBill).serviceCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Service Charge</span><span className="font-medium">Rs {(bill as IUtilityBill).serviceCharge.toLocaleString()}</span></div>}
                    {(bill as IUtilityBill).securityCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Security Charge</span><span className="font-medium">Rs {(bill as IUtilityBill).securityCharge.toLocaleString()}</span></div>}
                </div>
            )}

            <Separator className="my-4" />

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span>Rs {totalAmount.toLocaleString('en-IN')}</span>
            </div>
        </div>

        <div className="flex justify-end">
            <Button onClick={() => printBill(bill, bill.type.toLowerCase() as 'rent' | 'utility')}>
                <Printer className="mr-2 h-4 w-4" />
                Print Bill
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}