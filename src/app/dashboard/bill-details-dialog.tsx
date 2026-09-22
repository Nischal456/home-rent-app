'use client';

// --- Core React & Next.js Imports ---
import React from 'react';
import { useMediaQuery } from 'usehooks-ts';

// --- UI Components from shadcn/ui ---
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- Icons from lucide-react ---
import { 
  Printer, Receipt, Zap, Droplets, User, Building, CalendarDays, 
  CheckCircle, Hourglass, AlertTriangle, Shield, Settings, Info,
  Share2, MessageSquare
} from 'lucide-react';

// --- Utilities & Types ---
import { IRentBill, IUtilityBill, IUser, IRoom } from '@/types';
import { printBill } from '@/lib/printBill';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import NepaliDate from 'nepali-date-converter';
import { shareBill } from '@/lib/formatBillShare';

const formatNepaliDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A';
  try {
    return new NepaliDate(new Date(date)).format('YYYY MMMM DD');
  } catch {
    return 'N/A';
  }
};

// --- Type Definitions ---
type CombinedBill = (IRentBill | IUtilityBill) & { type: 'Rent' | 'Utility' };
type Status = 'DUE' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

// --- Helper Functions ---
const isTenantPopulated = (tenant: any): tenant is IUser => {
  return tenant && typeof tenant === 'object' && 'fullName' in tenant;
};
const isRoomPopulated = (room: any): room is IRoom => {
  return room && typeof room === 'object' && 'roomNumber' in room;
};

// --- Reusable Bank-Grade Bill Content ---
function BankBillContent({
  bill,
  user,
  onClose,
}: {
  bill: CombinedBill;
  user?: IUser | null;
  onClose: () => void;
}) {
  const isUtility = bill.type === 'Utility';
  const totalAmount = isUtility ? (bill as IUtilityBill).totalAmount : (bill as IRentBill).amount;
  const period = isUtility ? (bill as IUtilityBill).billingMonthBS : (bill as IRentBill).rentForPeriod;
  const billDate = bill.billDateBS || (bill.billDateAD ? new NepaliDate(new Date(bill.billDateAD)).format('YYYY MMMM DD') : 'Current');
  const paidAmount = Number(bill.paidAmount || 0);
  const remainingAmount = bill.status === 'PAID' ? 0 : Number(bill.remainingAmount ?? (totalAmount - paidAmount));

  const isPaid = bill.status === 'PAID';
  const isPartial = bill.status === 'PARTIALLY_PAID';

  const tenant = isTenantPopulated(bill.tenantId) ? bill.tenantId : user;
  const room = isRoomPopulated(bill.roomId) 
    ? bill.roomId 
    : (user && isRoomPopulated(user.roomId) ? user.roomId : null);
  
  const tenantName = tenant?.fullName || 'Tenant';
  const roomNumber = room?.roomNumber || 'Apartment';

  return (
    <div className="flex flex-col h-full w-full bg-white text-slate-900 overflow-hidden">
      {/* --- Bank Statement Header --- */}
      <div className="relative px-6 pt-6 pb-5 sm:px-8 sm:pt-8 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
              STG TOWER STATEMENT
            </span>
            <span className="text-[11px] font-bold text-slate-300">•</span>
            <span className="text-[10px] sm:text-[11px] font-extrabold text-[#0B2863] uppercase tracking-wider">
              {isUtility ? 'Utility Account' : 'Rental Housing'}
            </span>
          </div>
        </div>

        {/* Hero Amount & Status (FinTech Banking App UI) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Statement Total Amount
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Rs {totalAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-400">NPR</span>
            </div>
          </div>

          <div>
            <Badge
              variant="outline"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs",
                isPaid
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isPartial
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              )}
            >
              {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <Hourglass className="w-3.5 h-3.5" />}
              <span>{isPaid ? 'Settled in Full' : isPartial ? 'Partially Paid' : 'Payment Due'}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* --- Scrollable Body (Bank Ledger & Charges) --- */}
      <div className="flex-1 overflow-y-auto styled-scrollbar p-5 sm:p-7 space-y-5 bg-[#f8fafc]">
        {/* Bank Transaction Meta Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Account / Tenant</p>
            <p className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5 truncate">{tenantName}</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unit / Room</p>
            <p className="font-extrabold text-[#0B2863] text-sm sm:text-base mt-0.5">{roomNumber}</p>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Billing Cycle</p>
            <p className="font-extrabold text-slate-800 text-sm sm:text-base mt-0.5">{period}</p>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Statement Date (B.S.)</p>
            <p className="font-extrabold text-slate-800 text-sm sm:text-base mt-0.5">{billDate}</p>
          </div>
        </div>

        {/* Itemized Charges Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-400" />
              Itemized Charges Summary
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              {isUtility ? 'Metered Services' : 'Housing Agreement'}
            </span>
          </div>

          {!isUtility ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Rental Period</p>
                <p className="font-black text-slate-900 text-lg">{(bill as IRentBill).rentForPeriod}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Amount</p>
                <p className="font-black text-[#0B2863] text-2xl">Rs {(bill as IRentBill).amount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Electricity Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                <div className="flex items-center justify-between mb-3 pl-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base leading-tight">Electricity</h4>
                      <p className="text-[11px] font-semibold text-slate-400">
                        @ Rs {(bill as IUtilityBill).electricity?.ratePerUnit || (bill as IUtilityBill).electricity?.rate || 19}/unit
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 text-lg sm:text-xl">
                    Rs {(bill as IUtilityBill).electricity.amount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50/90 rounded-xl p-3 text-center border border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PREV</p>
                    <p className="font-extrabold text-slate-700 text-sm mt-0.5">{(bill as IUtilityBill).electricity.previousReading}</p>
                  </div>
                  <div className="border-x border-slate-200/80">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CURR</p>
                    <p className="font-extrabold text-slate-700 text-sm mt-0.5">{(bill as IUtilityBill).electricity.currentReading}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">UNITS</p>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{(bill as IUtilityBill).electricity.unitsConsumed}</p>
                  </div>
                </div>
              </div>

              {/* Water Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <div className="flex items-center justify-between mb-3 pl-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base leading-tight">Water</h4>
                      <p className="text-[11px] font-semibold text-slate-400">
                        @ Rs {(bill as IUtilityBill).water?.ratePerUnit || (bill as IUtilityBill).water?.rate || 0.3}/Litre
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 text-lg sm:text-xl">
                    Rs {(bill as IUtilityBill).water.amount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50/90 rounded-xl p-3 text-center border border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PREV</p>
                    <p className="font-extrabold text-slate-700 text-sm mt-0.5">{(bill as IUtilityBill).water.previousReading}</p>
                  </div>
                  <div className="border-x border-slate-200/80">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CURR</p>
                    <p className="font-extrabold text-slate-700 text-sm mt-0.5">{(bill as IUtilityBill).water.currentReading}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">LITRES</p>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{Number((bill as IUtilityBill).water.unitsConsumed).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Three Phase Meter Card (if applicable) */}
              {(bill as IUtilityBill).threePhase && ((bill as IUtilityBill).threePhase?.amount ?? 0) > 0 && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600"></div>
                  <div className="flex items-center justify-between mb-3 pl-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base leading-tight">Three Phase Meter</h4>
                        <p className="text-[11px] font-semibold text-slate-400">Power Line Charge</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-lg sm:text-xl">
                      Rs {(bill as IUtilityBill).threePhase?.amount?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50/90 rounded-xl p-3 text-center border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PREV</p>
                      <p className="font-extrabold text-slate-700 text-sm mt-0.5">{(bill as IUtilityBill).threePhase?.previousReading}</p>
                    </div>
                    <div className="border-x border-slate-200/80">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CURR</p>
                      <p className="font-extrabold text-slate-700 text-sm mt-0.5">{(bill as IUtilityBill).threePhase?.currentReading}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">UNITS</p>
                      <p className="font-black text-slate-900 text-sm mt-0.5">{(bill as IUtilityBill).threePhase?.unitsConsumed}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Service & Security Charges */}
              {((bill as IUtilityBill).serviceCharge > 0 || (bill as IUtilityBill).securityCharge > 0) && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                  {(bill as IUtilityBill).serviceCharge > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-slate-600 font-bold">
                        <Settings className="w-4 h-4 text-slate-400" /> Service Charge
                      </div>
                      <span className="font-black text-slate-800">
                        Rs {(bill as IUtilityBill).serviceCharge.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {(bill as IUtilityBill).serviceCharge > 0 && (bill as IUtilityBill).securityCharge > 0 && (
                    <Separator className="bg-slate-100" />
                  )}
                  {(bill as IUtilityBill).securityCharge > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-slate-600 font-bold">
                        <Shield className="w-4 h-4 text-slate-400" /> Security Charge
                      </div>
                      <span className="font-black text-slate-800">
                        Rs {(bill as IUtilityBill).securityCharge.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bank Ledger Summary (Paid vs Remaining) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-slate-500">Bill Sub-Total</span>
            <span className="font-black text-slate-900">Rs {totalAmount.toLocaleString('en-IN')}</span>
          </div>

          {paidAmount > 0 && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-emerald-600">Settled / Paid</span>
                <span className="font-black text-emerald-600">- Rs {paidAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((paidAmount / totalAmount) * 100, 100)}%` }}
                />
              </div>
            </>
          )}

          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <span className="font-black text-slate-700 text-sm uppercase tracking-wider">Outstanding Balance</span>
            <span className={cn(
              "font-black text-xl",
              remainingAmount > 0 ? "text-rose-600" : "text-emerald-600"
            )}>
              Rs {remainingAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {bill.paymentHistory && bill.paymentHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
              <div className="flex items-center justify-between mb-2.5">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Payment History & Notes
                </h5>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {bill.paymentHistory.length} {bill.paymentHistory.length === 1 ? 'Payment' : 'Payments'}
                </span>
              </div>
              <div className="space-y-2">
                {bill.paymentHistory.map((pmt: any, idx: number) => (
                  <div key={idx} className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-bold text-slate-800">{formatNepaliDate(pmt.date)}</span>
                      </div>
                      <span className="font-black text-emerald-600 text-sm">Rs {pmt.amount.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Note added by Admin on payment */}
                    {pmt.remarks && pmt.remarks.trim() !== '' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-start gap-2 bg-white p-2.5 rounded-xl border border-blue-100">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">
                            Note from Admin
                          </span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5 whitespace-pre-wrap leading-relaxed">
                            {pmt.remarks.trim()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Remarks Section */}
        {bill.remarks && bill.remarks.trim() !== '' && (
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-xs">
            <p className="font-extrabold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-600" /> Bill Remarks / Instructions
            </p>
            <p className="font-medium text-amber-900 leading-relaxed whitespace-pre-wrap">{bill.remarks.trim()}</p>
          </div>
        )}
      </div>

      {/* --- Sticky Banking Action Footer --- */}
      <div className="bg-white border-t border-slate-200/80 px-6 py-4 sm:px-8 sm:py-5 flex items-center justify-between shrink-0 gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">
            TOTAL PAYABLE
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#0B2863] tracking-tight">
            Rs {remainingAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <Button
            type="button"
            onClick={async () => {
              const isRent = bill.type === 'Rent';
              const utBill = !isRent ? (bill as IUtilityBill) : undefined;
              const tenantObj = bill.tenantId as any;
              const roomObj = bill.roomId as any;

              const res = await shareBill({
                billId: bill._id,
                type: bill.type,
                tenantName: tenantObj?.fullName || tenantName,
                roomNumber: roomObj?.roomNumber || roomNumber,
                billingPeriod: isRent ? (bill as any).rentForPeriod : (bill as any).billingMonthBS,
                billDateBS: (bill as any).billDateBS,
                totalAmount: totalAmount,
                remainingAmount: remainingAmount,
                totalOutstandingDue: (bill as any).totalOutstandingDue,
                status: bill.status,
                electricity: utBill?.electricity,
                water: utBill?.water,
                threePhase: utBill?.threePhase,
                serviceCharge: utBill?.serviceCharge,
                securityCharge: utBill?.securityCharge,
                remarks: bill.remarks,
              });

              if (res.method === 'clipboard' && res.success) {
                toast.success('Bill breakdown & link copied to clipboard!');
              }
            }}
            className="h-10 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
            title="Share Bill"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* View Official Bill / Print Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => printBill(bill)}
            className="h-10 px-3 rounded-xl font-bold text-xs text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
            title="Print invoice"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          {/* Close Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-10 px-4 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Main Dialog Component with Desktop/Mobile Responsive Behavior ---
interface BillDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bill: CombinedBill | null;
  user?: IUser | null;
}

export function BillDetailsDialog({ isOpen, onClose, bill, user }: BillDetailsDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  if (!bill) return null;

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 border border-slate-200/90 rounded-[2.5rem] shadow-2xl bg-white max-w-xl w-[95vw] h-[85vh] max-h-[85vh] flex flex-col overflow-hidden outline-none [&>button]:top-5 [&>button]:right-5 [&>button]:text-slate-400 [&>button]:hover:text-slate-800 [&>button]:bg-slate-100 [&>button]:hover:bg-slate-200 [&>button]:rounded-full [&>button]:p-1.5 [&>button]:transition-colors">
          <BankBillContent bill={bill} user={user} onClose={onClose} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="p-0 border-0 rounded-t-[2.5rem] shadow-2xl bg-white h-[88dvh] max-h-[88dvh] flex flex-col w-full mx-auto outline-none overflow-hidden">
        <BankBillContent bill={bill} user={user} onClose={onClose} />
      </DrawerContent>
    </Drawer>
  );
}