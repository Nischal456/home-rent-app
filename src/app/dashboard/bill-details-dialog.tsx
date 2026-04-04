'use client';

// --- Core React & Next.js Imports ---
import React from 'react';

// --- UI Components from shadcn/ui ---
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- Icons from lucide-react ---
import { 
  Printer, Receipt, Zap, Droplets, User, Building, CalendarDays, 
  CheckCircle, Hourglass, AlertTriangle, Shield, Settings, Info,
  Share2
} from 'lucide-react';

// --- Utilities & Types ---
import { IRentBill, IUtilityBill, IUser, IRoom } from '@/types';
import { printBill } from '@/lib/printBill';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import NepaliDate from 'nepali-date-converter';

const formatNepaliDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    return new NepaliDate(new Date(date)).format('YYYY MMMM DD');
};

// --- Type Definitions ---
type CombinedBill = (IRentBill | IUtilityBill) & { type: 'Rent' | 'Utility' };
type Status = 'DUE' | 'PAID' | 'OVERDUE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

// --- Helper Functions ---
const isTenantPopulated = (tenant: any): tenant is IUser => {
  return tenant && typeof tenant === 'object' && 'fullName' in tenant;
};
const isRoomPopulated = (room: any): room is IRoom => {
  return room && typeof room === 'object' && 'roomNumber' in room;
};

// --- Reusable Sub-Component for Status ---
const StatusBadge = ({ status }: { status: Status }) => {
  const statusConfig = {
    PAID: { text: "Paid", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-emerald-100/80 text-emerald-700 border-emerald-200" },
    DUE: { text: "Due", icon: <Hourglass className="h-3.5 w-3.5" />, className: "bg-amber-100/80 text-amber-700 border-amber-200" },
    PENDING: { text: "Pending", icon: <Hourglass className="h-3.5 w-3.5 animate-spin-slow" />, className: "bg-blue-100/80 text-blue-700 border-blue-200" },
    OVERDUE: { text: "Overdue", icon: <AlertTriangle className="h-3.5 w-3.5" />, className: "bg-red-100/80 text-red-700 border-red-200 animate-pulse" },
  };
  const config = statusConfig[status as keyof typeof statusConfig] || { text: status, icon: null, className: "bg-slate-100/80 text-slate-700" };
  return (
    <Badge variant="outline" className={cn("inline-flex items-center gap-1.5 font-bold tracking-wide rounded-full px-3 py-1 backdrop-blur-md shadow-sm", config.className)}>
      {config.icon}<span>{config.text}</span>
    </Badge>
  );
};

// --- Main Dialog Component ---
interface BillDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bill: CombinedBill | null;
  user?: IUser | null;
}

export function BillDetailsDialog({ isOpen, onClose, bill, user }: BillDetailsDialogProps) {
  if (!bill) return null;

  const isRentBill = bill.type === 'Rent';
  const totalAmount = isRentBill ? (bill as IRentBill).amount : (bill as IUtilityBill).totalAmount;

  // Safely get tenant and room details
  const tenant = isTenantPopulated(bill.tenantId) ? bill.tenantId : user;
  const room = isRoomPopulated(bill.roomId) 
    ? bill.roomId 
    : (user && isRoomPopulated(user.roomId) ? user.roomId : null);
  
  const roomNumber = room ? room.roomNumber : 'N/A';

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="p-0 outline-none pb-safe">
        
        <div className="w-full sm:max-w-md md:max-w-xl mx-auto p-5 overflow-y-auto max-h-[85vh]">
          {/* --- Header Section --- */}
          <DrawerHeader className="mb-4 px-0 pb-0">
            <DrawerTitle className="flex flex-col sm:flex-row items-center justify-center gap-3 text-2xl font-black text-slate-900 tracking-tight text-center">
              <div className={cn("shrink-0 p-3 rounded-2xl shadow-inner", isRentBill ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600")}>
                {isRentBill ? <Receipt className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
              </div>
              {bill.type} Bill
            </DrawerTitle>
            <DrawerDescription className="text-center mt-1 text-base font-bold text-slate-400">
              Detailed breakdown & charges
            </DrawerDescription>
          </DrawerHeader>

          {/* --- Scrollable Body Content --- */}
          <div className="space-y-6 mt-4 px-1">
          
          {/* Top Meta Info Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Tenant</span>
              </div>
              <span className="font-bold text-slate-800 line-clamp-1">{tenant?.fullName ?? 'N/A'}</span>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Building className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Room</span>
              </div>
              <span className="font-bold text-[#0B2863] text-lg leading-none">{roomNumber}</span>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Date (B.S)</span>
              </div>
              <span className="font-bold text-slate-800">{bill.billDateBS ?? 'N/A'}</span>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-start">
               <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Info className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Status</span>
              </div>
              <StatusBadge status={bill.status as Status} />
            </div>
          </div>

          <Separator className="bg-slate-200/60" />

          {/* Charges Breakdown */}
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
               <Receipt className="w-5 h-5 text-slate-400" /> Charges Summary
            </h3>
            
            {isRentBill ? (
               // --- Rent Bill Specific Layout ---
               <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                     <p className="text-xs font-extrabold text-blue-400 uppercase tracking-wider mb-1">Period</p>
                     <p className="font-bold text-slate-800 text-lg">{(bill as IRentBill).rentForPeriod}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-extrabold text-blue-400 uppercase tracking-wider mb-1">Amount</p>
                     <p className="font-black text-[#0B2863] text-xl">Rs {(bill as IRentBill).amount.toLocaleString('en-IN')}</p>
                  </div>
               </div>
            ) : (
              // --- Utility Bill Specific Layout ---
              <div className="space-y-4">
                  {/* Electricity Card */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl"><Zap className="w-5 h-5" /></div>
                          <h4 className="font-extrabold text-slate-800 text-base">Electricity</h4>
                        </div>
                        <span className="font-black text-slate-900 text-lg">Rs {(bill as IUtilityBill).electricity.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center">
                         <div>
                           <p className="text-[10px] font-extrabold text-slate-400 uppercase">Previous</p>
                           <p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).electricity.previousReading}</p>
                         </div>
                         <div className="border-x border-slate-200">
                           <p className="text-[10px] font-extrabold text-slate-400 uppercase">Current</p>
                           <p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).electricity.currentReading}</p>
                         </div>
                         <div>
                           <p className="text-[10px] font-extrabold text-yellow-500 uppercase">Units</p>
                           <p className="font-black text-slate-900 mt-0.5">{(bill as IUtilityBill).electricity.unitsConsumed}</p>
                         </div>
                      </div>
                  </div>

                  {/* Water Card */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Droplets className="w-5 h-5" /></div>
                          <h4 className="font-extrabold text-slate-800 text-base">Water</h4>
                        </div>
                        <span className="font-black text-slate-900 text-lg">Rs {(bill as IUtilityBill).water.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center">
                         <div>
                           <p className="text-[10px] font-extrabold text-slate-400 uppercase">Previous</p>
                           <p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).water.previousReading}</p>
                         </div>
                         <div className="border-x border-slate-200">
                           <p className="text-[10px] font-extrabold text-slate-400 uppercase">Current</p>
                           <p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).water.currentReading}</p>
                         </div>
                         <div>
                           <p className="text-[10px] font-extrabold text-blue-500 uppercase">Units</p>
                           <p className="font-black text-slate-900 mt-0.5">{(bill as IUtilityBill).water.unitsConsumed}</p>
                         </div>
                      </div>
                  </div>

                  {/* Additional Charges */}
                  {((bill as IUtilityBill).serviceCharge > 0 || (bill as IUtilityBill).securityCharge > 0) && (
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                       {(bill as IUtilityBill).serviceCharge > 0 && (
                         <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                             <Settings className="w-4 h-4 text-slate-400" /> Service Charge
                           </div>
                           <span className="font-extrabold text-slate-800">Rs {(bill as IUtilityBill).serviceCharge.toLocaleString('en-IN')}</span>
                         </div>
                       )}
                       {(bill as IUtilityBill).serviceCharge > 0 && (bill as IUtilityBill).securityCharge > 0 && <Separator className="bg-slate-100" />}
                       {(bill as IUtilityBill).securityCharge > 0 && (
                         <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                             <Shield className="w-4 h-4 text-slate-400" /> Security Charge
                           </div>
                           <span className="font-extrabold text-slate-800">Rs {(bill as IUtilityBill).securityCharge.toLocaleString('en-IN')}</span>
                         </div>
                       )}
                    </div>
                  )}
              </div>
            )}
            
            {/* Remarks Section */}
            {!isRentBill && (bill as IUtilityBill).remarks && (
              <div className="mt-4 bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
                <h4 className="font-extrabold text-orange-800 text-sm mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Note from Admin
                </h4>
                <p className="text-sm font-medium text-orange-900/80 whitespace-pre-wrap leading-relaxed">
                  {(bill as IUtilityBill).remarks}
                </p>
              </div>
            )}
          </div>
            {/* Remaining Amount & Payment Tracker Additions */}
            {parseFloat(bill.paidAmount as any) > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl mt-4 border border-slate-200 shadow-sm">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-600">Paid</span>
                        <span className="font-black text-green-600 text-lg">Rs {(bill.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-3">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(((bill.paidAmount || 0) / totalAmount) * 100, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="font-bold text-slate-600">Remaining</span>
                        <span className="font-black text-red-500 text-lg uppercase">Rs {(bill.remainingAmount ?? totalAmount).toLocaleString()}</span>
                    </div>
                    
                    {bill.paymentHistory && bill.paymentHistory.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 border-dashed">
                            <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Payment Tracker</h5>
                            <div className="space-y-2">
                                {bill.paymentHistory.map((pmt: any, idx: number) => (
                                    <div key={idx} className="flex flex-row justify-between items-start text-xs bg-white p-2.5 rounded-xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="font-extrabold text-slate-800">{formatNepaliDate(pmt.date)}</div>
                                            {pmt.remarks && <div className="text-[10px] text-slate-500 italic mt-0.5 truncate">{pmt.remarks}</div>}
                                        </div>
                                        <div className="font-black text-emerald-600 shrink-0">Rs {pmt.amount.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
          </div>
        </div>

        {/* --- Fixed Sticky Footer --- */}
        <DrawerFooter className="px-5 pt-2 pb-6 border-t border-slate-100 bg-white items-center gap-4">
            <div className="flex flex-row items-center justify-between w-full h-full max-w-sm mx-auto">
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Total Payable</span>
                <span className="text-xl sm:text-2xl font-black text-[#0B2863] tracking-tight">
                  Rs {(bill.remainingAmount ?? totalAmount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                     const url = `${window.location.origin}/bill/${bill._id}`;
                     const text = `Hello! Here is your ${bill.type} Bill for ${bill.type === 'Rent' ? (bill as any).rentForPeriod : (bill as any).billingMonthBS}.\nTotal Amount: Rs ${totalAmount.toLocaleString()}\nRemaining Due: Rs ${(bill.remainingAmount ?? totalAmount).toLocaleString()}`;
                     if (navigator.share) {
                        navigator.share({ title: `${bill.type} Bill`, text: text, url: url }).catch(console.error);
                     } else {
                        navigator.clipboard.writeText(`${text}\n${url}`);
                        toast.success('Link copied to clipboard!', { icon: '🔗' });
                     }
                  }}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 rounded-xl shadow-sm font-bold h-12 px-4 shrink-0 transition-all active:scale-95"
                >
                    <Share2 className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => printBill(bill)}
                  className="bg-[#0B2863] hover:bg-blue-800 text-white rounded-xl shadow-lg shadow-blue-900/20 font-bold h-12 px-5 sm:px-6 transform-gpu active:scale-95 transition-all duration-200 flex items-center gap-2"
                >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:block">Print Invoice</span>
                    <span className="sm:hidden">Print</span>
                </Button>
              </div>
            </div>
        </DrawerFooter>

      </DrawerContent>
    </Drawer>
  );
}