'use client';

// --- Core React Imports ---
import { useState } from 'react';
import Image from 'next/image';

// --- UI Components from shadcn/ui ---
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// --- Icons from lucide-react ---
import { 
  Loader2, CheckCircle, QrCode, Receipt, Zap, 
  ShieldCheck, Banknote, X, ArrowRight
} from 'lucide-react';

// --- Utilities & Types ---
import { toast } from 'react-hot-toast';
import { IRentBill, IUtilityBill } from '@/types';
import { requestPaymentVerification } from './actions';
import { cn } from '@/lib/utils';

// --- Component Interface ---
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
      toast.success('Confirmation sent! Your bills will be updated shortly.', {
        icon: '✅',
        style: {
          borderRadius: '1rem',
          background: '#fff',
          color: '#064e3b',
          fontWeight: 'bold',
          border: '1px solid #d1fae5',
        },
      });
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Strict Flex Layout Container:
        w-[95vw] and max-h-[90dvh] ensures it perfectly fits any mobile screen.
        [&>button]:hidden removes the default top-right Shadcn 'X' to prevent double close buttons.
      */}
      <DialogContent className="sm:max-w-md md:max-w-4xl p-0 border-0 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl bg-white overflow-hidden flex flex-col w-[95vw] max-h-[90dvh] [&>button]:hidden">
        
        {/* --- 1. FIXED HEADER --- */}
        <div className="relative flex items-center justify-between p-5 md:p-6 bg-white border-b border-slate-100 z-20 shrink-0">
          {/* Top Gradient Accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400"></div>
          
          <DialogTitle className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 md:p-2.5 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl shadow-inner">
              <Banknote className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            Secure Checkout
          </DialogTitle>
          
          <button 
            onClick={onClose} 
            className="p-2 md:p-2.5 bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all active:scale-95 border border-transparent hover:border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- 2. SCROLLABLE MIDDLE BODY --- */}
        <div className="flex-1 overflow-y-auto styled-scrollbar bg-[#f8fafc]">
          <div className="flex flex-col md:flex-row h-full">
            
            {/* Left Column: Premium QR Code Display */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-10 bg-white relative">
              {/* Radial Glow Effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,theme(colors.emerald.50)_0%,transparent_70%)] opacity-80 pointer-events-none"></div>
              
              <div className="relative z-10 p-3 md:p-4 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 mb-6 transform transition-transform duration-500 hover:scale-105">
                <Image 
                  src="/payment-qr.png" 
                  alt="Payment QR Code" 
                  width={240}
                  height={240}
                  className="rounded-2xl pointer-events-none w-[180px] h-[180px] md:w-[240px] md:h-[240px]"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/240x240/f8fafc/94a3b8?text=QR+Code'; e.currentTarget.alt = 'QR code placeholder'; }}
                  priority
                />
              </div>
              
              <div className="relative z-10 text-center space-y-2.5">
                 <h4 className="font-extrabold text-slate-900 flex items-center justify-center gap-2 text-lg md:text-xl">
                   <QrCode className="w-5 h-5 md:w-6 md:h-6 text-emerald-500"/> Scan to Pay
                 </h4>
                 <div className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100/50 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Verified STG Tower Account
                 </div>
              </div>
            </div>

            {/* Right Column: Itemized Dues List */}
            <div className="w-full md:w-1/2 flex flex-col p-6 md:p-8 md:border-l border-slate-100/80 bg-[#f8fafc]">
              <h3 className="text-xs md:text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Itemized Breakdown
              </h3>
              
              <div className="space-y-3">
                {/* Rent Bills */}
                {rentBillsDue.map(bill => (
                  <div key={bill._id.toString()} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:border-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Receipt className="w-4 h-4 md:w-5 md:h-5" /></div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm md:text-base">Rent</p>
                        <p className="text-xs font-bold text-slate-400">{bill.rentForPeriod ?? 'Current Period'}</p>
                      </div>
                    </div>
                    <span className="font-black text-[#0B2863] text-base md:text-lg">Rs {bill.amount?.toLocaleString('en-IN') ?? 'N/A'}</span>
                  </div>
                ))}

                {/* Utility Bills */}
                {utilityBillsDue.map(bill => (
                  <div key={bill._id.toString()} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:border-orange-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><Zap className="w-4 h-4 md:w-5 md:h-5" /></div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm md:text-base">Utility</p>
                        <p className="text-xs font-bold text-slate-400">{bill.billingMonthBS ?? 'Current Month'}</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-base md:text-lg">Rs {bill.totalAmount?.toLocaleString('en-IN') ?? 'N/A'}</span>
                  </div>
                ))}

                {/* Empty State */}
                {rentBillsDue.length === 0 && utilityBillsDue.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-400">No pending dues found.</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* --- 3. FIXED FOOTER (Contains Cancel & Confirm Buttons) --- */}
        <div className="bg-white border-t border-slate-100 p-5 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] z-20 flex flex-col sm:flex-row gap-5 items-center justify-between shrink-0">
            
            {/* Total Display */}
            <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Payable</span>
              <span className="text-3xl md:text-4xl font-black text-emerald-600 tracking-tight leading-none">
                Rs {totalDue?.toLocaleString('en-IN') ?? '0'}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex w-full sm:w-auto gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 sm:flex-none h-12 md:h-14 px-6 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmPayment} 
                disabled={isLoading || totalDue === 0} 
                className="flex-[2] sm:flex-none h-12 md:h-14 px-6 md:px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/30 font-bold transform-gpu active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                   <>
                     <CheckCircle className="w-5 h-5 text-emerald-100" />
                     <span className="text-base tracking-wide">I Have Paid</span>
                     <ArrowRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all hidden sm:block" />
                   </>
                )}
              </Button>
            </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}