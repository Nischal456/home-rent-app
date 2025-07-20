'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { IRentBill, IUtilityBill } from '@/types';
import { Separator } from '@/components/ui/separator';
import { requestPaymentVerification } from './actions';
import Image from 'next/image'; // ✅ FIX: Import the Image component

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rentBillsDue: IRentBill[];
  utilityBillsDue: IUtilityBill[];
  totalDue: number;
}

export function PaymentDialog({ isOpen, onClose, rentBillsDue, utilityBillsDue, totalDue }: PaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmPayment = async () => {
    setIsLoading(true);
    try {
      const result = await requestPaymentVerification();

      if (!result.success) {
        throw new Error(result.message || 'Failed to send confirmation.');
      }
      toast.success('Confirmation sent to admin! Your bills will be updated shortly.');
      onClose();
    } catch (error) {
      // ✅ FIX: Safely handle the error type
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Payment Details</DialogTitle>
          <DialogDescription className="text-center">
            Scan the QR code and then confirm your payment below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 py-4">
          <div className="flex-shrink-0">
            {/* ✅ FIX: Replaced <img> with <Image> */}
            <Image 
              src="/payment-qr.png" 
              alt="Payment QR Code" 
              width={192}
              height={192}
              className="rounded-lg shadow-md"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/192x192/e2e8f0/e2e8f0?text=QR'; e.currentTarget.alt = 'QR code placeholder'; }}
            />
          </div>
          <div className="w-full space-y-2 text-sm">
            <h3 className="font-semibold mb-2">Itemized Dues</h3>
            {rentBillsDue.map(bill => (
              // ✅ FIX: Convert ObjectId to string for the key prop
              <div key={bill._id.toString()} className="flex justify-between items-center">
                <span className="text-muted-foreground">{bill.rentForPeriod}</span>
                <span className="font-medium">Rs {bill.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
            {utilityBillsDue.map(bill => (
              // ✅ FIX: Convert ObjectId to string for the key prop
              <div key={bill._id.toString()} className="flex justify-between items-center">
                <span className="text-muted-foreground">Utility: {bill.billingMonthBS}</span>
                <span className="font-medium">Rs {bill.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            ))}
            <Separator className="my-2"/>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span>Rs {totalDue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirmPayment} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                I Have Paid
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}